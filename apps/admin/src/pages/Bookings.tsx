import { Table, Tag, Button, Space, Card } from 'antd';

const DATA = Array.from({ length: 15 }, (_, i) => ({
  key: i, id: `WB-${1000+i}`, customer: `Customer ${i+1}`, vendor: ['Royal Palace','Srikanth Phot.','Flavours Cat.','Blooms Decor','Shika Makeup'][i%5], date: `${14+i} Feb 2027`, amount: `₹${((i+1)*25000).toLocaleString()}`, status: ['enquiry','quoted','confirmed','advance_paid','completed','cancelled'][i%6],
}));

export function Bookings() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Bookings</h1>
      <Card>
        <Table dataSource={DATA} size="small" columns={[
          { title: 'ID', dataIndex: 'id', render: (t) => <code style={{ fontSize: 11 }}>{t}</code> },
          { title: 'Customer', dataIndex: 'customer' },
          { title: 'Vendor', dataIndex: 'vendor' },
          { title: 'Event Date', dataIndex: 'date' },
          { title: 'Amount', dataIndex: 'amount', render: (t) => <strong>{t}</strong> },
          { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s==='confirmed'||s==='completed'?'green':s==='cancelled'?'red':s==='advance_paid'?'blue':'orange'}>{s.replace('_',' ').toUpperCase()}</Tag> },
          { title: 'Actions', render: () => <Space><Button size="small">View</Button><Button size="small" type="link">Resolve</Button></Space> },
        ]} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}

export function Users() {
  const data = Array.from({ length: 15 }, (_, i) => ({ key: i, id: `USR-${1000+i}`, phone: `+91 9${Math.floor(Math.random()*900000000+100000000)}`, role: ['customer','vendor','customer','customer','vendor'][i%5], status: i%7===0 ? 'suspended' : 'active', bookings: Math.floor(Math.random()*20) }));
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Users</h1>
      <Card>
        <Table dataSource={data} size="small" columns={[
          { title: 'ID', dataIndex: 'id', render: (t) => <code style={{ fontSize: 11 }}>{t}</code> },
          { title: 'Phone', dataIndex: 'phone' },
          { title: 'Role', dataIndex: 'role', render: (r) => <Tag color={r==='vendor'?'purple':'blue'}>{r.toUpperCase()}</Tag> },
          { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s==='active'?'green':'red'}>{s.toUpperCase()}</Tag> },
          { title: 'Bookings', dataIndex: 'bookings' },
          { title: 'Actions', render: (_, r: any) => <Space><Button size="small">View</Button>{r.status==='active'?<Button size="small" danger>Suspend</Button>:<Button size="small" type="primary">Restore</Button>}</Space> },
        ]} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}

export function Payments() {
  const data = Array.from({ length: 15 }, (_, i) => ({ key: i, id: `PAY-${5000+i}`, booking: `WB-${1000+i}`, amount: `₹${((i+1)*15000).toLocaleString()}`, type: ['advance','final','refund'][i%3], status: ['success','processing','failed','refunded'][i%4], escrow: i%5!==0 ? 'holding' : 'released' }));
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Payments & Escrow</h1>
      <Card>
        <Table dataSource={data} size="small" columns={[
          { title: 'ID', dataIndex: 'id', render: (t) => <code style={{ fontSize: 11 }}>{t}</code> },
          { title: 'Booking', dataIndex: 'booking' },
          { title: 'Amount', dataIndex: 'amount', render: (t) => <strong>{t}</strong> },
          { title: 'Type', dataIndex: 'type', render: (t) => <Tag>{t.toUpperCase()}</Tag> },
          { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s==='success'||s==='refunded'?'green':s==='failed'?'red':'blue'}>{s.toUpperCase()}</Tag> },
          { title: 'Escrow', dataIndex: 'escrow', render: (e) => <Tag color={e==='released'?'green':'orange'}>{e.toUpperCase()}</Tag> },
          { title: 'Actions', render: (_, r: any) => <Space><Button size="small">Details</Button>{r.escrow==='holding'&&<Button size="small" type="primary">Release</Button>}</Space> },
        ]} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
