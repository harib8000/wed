import { Table, Tag, Button, Space, Input, Select, Card } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const DATA = Array.from({ length: 20 }, (_, i) => ({
  key: i, id: `VND-${1000+i}`, name: ['Royal Grand Palace','Srikanth Photography','Flavours Catering','Blooms & Dreams','Shika Makeup','Beats DJ','Heritage Banquets','Frame Studios','Royal Feast','Garden Decor','Glamour Touch','Melody Masters','Pearl Weddings','Star Events','Sunrise Caterers','Modern Decor','Elite Photography','Dream Venues','Happy Moments','Perfect Click'][i],
  category: ['venue','photography','catering','decor','makeup','music','venue','photography','catering','decor','makeup','music','venue','photography','catering','decor','photography','venue','photography','photography'][i],
  city: ['Hyderabad','Hyderabad','Mumbai','Delhi','Hyderabad','Bangalore','Mumbai','Chennai','Delhi','Hyderabad','Pune','Jaipur','Hyderabad','Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Jaipur'][i],
  status: ['verified','verified','pending_kyc','rejected','verified','verified','pending_kyc','verified','verified','verified','pending_kyc','verified','verified','verified','pending_kyc','verified','verified','rejected','verified','verified'][i],
  rating: (4.2 + Math.random() * 0.8).toFixed(1),
  bookings: Math.floor(Math.random() * 100),
}));

export function Vendors() {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Vendors</h1>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="Search vendors..." style={{ width: 220 }} />
          <Select defaultValue="all" style={{ width: 140 }} options={[{ value:'all',label:'All Status'},{ value:'verified',label:'Verified'},{ value:'pending_kyc',label:'Pending KYC'},{ value:'rejected',label:'Rejected'}]} />
          <Select defaultValue="all" style={{ width: 140 }} options={[{ value:'all',label:'All Categories'},{ value:'venue',label:'Venue'},{ value:'photography',label:'Photography'},{ value:'catering',label:'Catering'}]} />
        </Space>
      </div>
      <Card>
        <Table
          dataSource={DATA}
          size="small"
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', render: (t) => <code style={{ fontSize: 11 }}>{t}</code> },
            { title: 'Name', dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
            { title: 'Category', dataIndex: 'category', key: 'category', render: (t) => <Tag>{t.charAt(0).toUpperCase()+t.slice(1)}</Tag> },
            { title: 'City', dataIndex: 'city', key: 'city' },
            { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r) => <span style={{ color: '#d97706' }}>⭐ {r}</span> },
            { title: 'Bookings', dataIndex: 'bookings', key: 'bookings' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s==='verified'?'green':s==='pending_kyc'?'orange':'red'}>{s==='verified'?'Verified':s==='pending_kyc'?'Pending KYC':'Rejected'}</Tag> },
            { title: 'Actions', key: 'actions', render: (_, r) => (
              <Space>
                <Button size="small">View</Button>
                {r.status === 'pending_kyc' && <><Button size="small" type="primary" icon={<CheckCircleOutlined />}>Approve</Button><Button size="small" danger icon={<CloseCircleOutlined />}>Reject</Button></>}
              </Space>
            )},
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
