const OrderHistoryPage = () => {
    const orders = [
        { id: '123456', date: '2025-01-20', status: 'Доставлен' },
        { id: '654321', date: '2025-01-15', status: 'В пути' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1>История заказов</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid #ccc', padding: '10px' }}>Номер заказа</th>
                        <th style={{ border: '1px solid #ccc', padding: '10px' }}>Дата</th>
                        <th style={{ border: '1px solid #ccc', padding: '10px' }}>Статус</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{order.id}</td>
                            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{order.date}</td>
                            <td style={{ border: '1px solid #ccc', padding: '10px' }}>{order.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderHistoryPage;
