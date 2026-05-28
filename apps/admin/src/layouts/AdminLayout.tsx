import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { DashboardOutlined, ShopOutlined, BookOutlined, UserOutlined, DollarOutlined, LogoutOutlined, BellOutlined, ExclamationCircleOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

const { Sider, Header, Content } = Layout;

const MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/vendors', icon: <ShopOutlined />, label: 'Vendors' },
  { key: '/bookings', icon: <BookOutlined />, label: 'Bookings' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: '/payments', icon: <DollarOutlined />, label: 'Payments' },
  { key: '/disputes', icon: <ExclamationCircleOutlined />, label: 'Disputes' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function logout() {
    Cookies.remove('admin_token');
    navigate('/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #c026d3, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>W</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Wedding OS</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Admin Panel</div>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={MENU_ITEMS}
          style={{ border: 'none', marginTop: 8 }}
          onClick={({ key }) => navigate(key)}
        />
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, padding: '0 16px' }}>
          <Button danger block onClick={logout} icon={<LogoutOutlined />}>Sign Out</Button>
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <Button icon={<BellOutlined />} shape="circle" />
          <Avatar style={{ background: '#c026d3' }}>A</Avatar>
          <span style={{ fontSize: 13, color: '#374151' }}>Admin</span>
        </Header>
        <Content style={{ margin: 24, background: 'transparent' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
