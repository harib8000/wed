import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main as ai_main


@pytest.mark.anyio
async def test_health_endpoint_returns_service_status() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)

    async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
        response = await client.get('/health')

    assert response.status_code == 200
    assert response.json() == {
        'status': 'ok',
        'service': 'ai-service',
        'ai_provider': ai_main.AI_PROVIDER,
    }


@pytest.mark.anyio
async def test_budget_planner_returns_normalized_allocations() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)
    payload = {
        'total_budget_paise': 4_000_000,
        'guest_count': 250,
        'venue_city': 'Bengaluru',
        'wedding_type': 'destination',
        'preferences': ['photography', 'catering'],
    }
    mock_response = '''Here is your budget plan:
    {
      "allocations": [
        {"category": "Venue", "percentage": 60, "estimated_paise": 1, "description": "Venue booking", "priority": "must_have"},
        {"category": "Photography", "percentage": 40, "estimated_paise": 1, "description": "Photo and video", "priority": "must_have"}
      ],
      "tips": ["Book key vendors early"],
      "warnings": ["Peak season pricing may vary"]
    }
    '''

    with patch.object(ai_main, 'call_llm', AsyncMock(return_value=mock_response)) as mock_call:
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
            response = await client.post('/ai/budget-planner', json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body['total_budget_paise'] == payload['total_budget_paise']
    assert body['allocations'][0]['estimated_paise'] == 2_400_000
    assert body['allocations'][1]['estimated_paise'] == 1_600_000
    assert body['tips'] == ['Book key vendors early']
    assert body['warnings'] == ['Peak season pricing may vary']

    system_prompt, user_message = mock_call.await_args.args
    assert 'professional Indian wedding planner' in system_prompt
    assert 'Bengaluru' in user_message
    assert 'destination' in user_message


@pytest.mark.anyio
async def test_budget_planner_returns_500_when_llm_response_is_invalid() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)
    payload = {
        'total_budget_paise': 2_500_000,
        'guest_count': 180,
        'venue_city': 'Hyderabad',
        'wedding_type': 'traditional',
        'preferences': [],
    }

    with patch.object(ai_main, 'call_llm', AsyncMock(return_value='No JSON available')):
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
            response = await client.post('/ai/budget-planner', json=payload)

    assert response.status_code == 500
    assert response.json() == {'detail': 'AI service temporarily unavailable'}


@pytest.mark.anyio
async def test_vendor_recommendations_returns_mocked_llm_payload() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)
    payload = {
        'category': 'photography',
        'city': 'Mumbai',
        'budget_paise': 180_000,
        'event_date': '2026-02-14',
        'style_preferences': ['candid', 'cinematic'],
        'guest_count': 300,
    }
    mock_response = '{"recommendations": [{"title": "Review full wedding albums", "description": "Ask for 3 recent albums in similar lighting conditions.", "priority": "high"}], "reasoning": "This helps validate consistent quality within the budget."}'

    with patch.object(ai_main, 'call_llm', AsyncMock(return_value=mock_response)) as mock_call:
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
            response = await client.post('/ai/vendor-recommendations', json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body['reasoning'] == 'This helps validate consistent quality within the budget.'
    assert body['recommendations'][0]['title'] == 'Review full wedding albums'

    system_prompt, user_message = mock_call.await_args.args
    assert 'expert Indian wedding vendor consultant' in system_prompt
    assert 'photography vendor' in user_message
    assert 'Mumbai' in user_message


@pytest.mark.anyio
async def test_vendor_recommendations_returns_500_on_llm_failure() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)
    payload = {
        'category': 'decor',
        'city': 'Chennai',
        'budget_paise': 250_000,
        'event_date': '2026-05-01',
        'style_preferences': ['floral'],
    }

    with patch.object(ai_main, 'call_llm', AsyncMock(side_effect=RuntimeError('upstream failure'))):
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
            response = await client.post('/ai/vendor-recommendations', json=payload)

    assert response.status_code == 500
    assert response.json() == {'detail': 'AI service temporarily unavailable'}


@pytest.mark.anyio
async def test_ai_chat_returns_message_and_suggestions_from_bullets() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)
    payload = {
        'messages': [
            {'role': 'user', 'content': f'Message {index}'} for index in range(12)
        ],
        'context': {'city': 'Jaipur', 'budget_paise': 1_200_000},
    }
    mock_response = 'A small palace wedding would suit your budget.\n1. Finalise the guest list\n- Compare two venue options\n• Book decorators early\n4. This line should not become a suggestion'

    with patch.object(ai_main, 'call_llm', AsyncMock(return_value=mock_response)) as mock_call:
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
            response = await client.post('/ai/chat', json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body['message'] == mock_response
    assert body['suggestions'] == [
        'Finalise the guest list',
        'Compare two venue options',
        'Book decorators early',
    ]

    system_prompt, user_message = mock_call.await_args.args
    assert 'friendly AI wedding planning assistant' in system_prompt
    assert 'User context' in user_message
    assert 'Message 0' not in user_message
    assert 'Message 1' not in user_message
    assert 'Message 11' in user_message


@pytest.mark.anyio
async def test_ai_chat_returns_500_on_llm_failure() -> None:
    transport = httpx.ASGITransport(app=ai_main.app)
    payload = {
        'messages': [{'role': 'user', 'content': 'Help me plan my mehendi.'}],
        'context': {'city': 'Pune'},
    }

    with patch.object(ai_main, 'call_llm', AsyncMock(side_effect=Exception('timeout'))):
        async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
            response = await client.post('/ai/chat', json=payload)

    assert response.status_code == 500
    assert response.json() == {'detail': 'AI service temporarily unavailable'}
