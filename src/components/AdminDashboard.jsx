import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import DashboardHeader from './DashboardHeader';

const BACKEND_URL = 'https://dev1003-p2p-crypto-lending-backend.onrender.com';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalLoansFunded: 0,
        activeLoans: 0,
        averageInterestRate: 0,
        totalCollateralValue: 0,
        platformEarnings: 0
    });
    const [loans, setLoans] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // Get stored user data
                const token = localStorage.getItem('token');
                const userEmail = localStorage.getItem('userEmail');
                const isAdmin = localStorage.getItem('isAdmin') === 'true';

                // Debug log to check token value
                console.log('Current auth state:', { 
                    hasToken: !!token, 
                    tokenValue: token,
                    isAdmin: isAdmin,
                    email: userEmail 
                });

                if (!token || !isAdmin) {
                    console.log('Not authenticated or not admin:', { token: !!token, isAdmin });
                    navigate('/login');
                    return;
                }

                // Common headers for all requests
                const headers = {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                };

                // Debug log to check headers
                console.log('Request headers:', headers);

                // Fetch admin dashboard data
                const [completedRes, activeRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/admin/deals-complete`, { 
                        headers,
                        credentials: 'include'
                    }),
                    fetch(`${BACKEND_URL}/admin/deals-incomplete`, { 
                        headers,
                        credentials: 'include'
                    })
                ]);

                // Check if either request failed
                if (!completedRes.ok || !activeRes.ok) {
                    // Log response details for debugging
                    console.log('Response details:', {
                        completedStatus: completedRes.status,
                        activeStatus: activeRes.status
                    });

                    // If unauthorized, redirect to login
                    if (completedRes.status === 401 || activeRes.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('isAdmin');
                        navigate('/login');
                        throw new Error('Unauthorized access. Please login again.');
                    }
                    throw new Error(`Failed to fetch data. Status: ${completedRes.status}, ${activeRes.status}`);
                }

                const [completedData, activeData] = await Promise.all([
                    completedRes.json(),
                    activeRes.json()
                ]);

                console.log('Deals data:', { completed: completedData, active: activeData });
                
                setStats(prevStats => ({
                    ...prevStats,
                    totalLoansFunded: completedData.totalCompletedDeals || 0,
                    activeLoans: activeData.ActiveDeals || 0,
                    // For now, keeping example data for other stats
                    averageInterestRate: 12.5,
                    totalCollateralValue: 2500000,
                    platformEarnings: 75000
                }));

                // Example loans data for the table
                setLoans([
                    {
                        id: 1,
                        borrower: 'john.doe@example.com',
                        lender: 'jane.smith@example.com',
                        amount: 50000,
                        status: 'Active',
                    },
                    {
                        id: 2,
                        borrower: 'bob.wilson@example.com',
                        lender: 'alice.brown@example.com',
                        amount: 75000,
                        status: 'Pending',
                    },
                    {
                        id: 3,
                        borrower: 'sarah.jones@example.com',
                        lender: 'mike.davis@example.com',
                        amount: 100000,
                        status: 'Completed',
                    }
                ]);
            } catch (err) {
                console.error('Error fetching admin data:', err);
                setError(err.message);
                // Set fallback data
                setStats({
                    totalLoansFunded: 0,
                    activeLoans: 0,
                    averageInterestRate: 0,
                    totalCollateralValue: 0,
                    platformEarnings: 0
                });
            }
        };

        fetchAdminData();
    }, [navigate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Get userEmail from localStorage for the header
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        return <div className={styles.loading}>Loading...</div>;
    }

    // Show error message if there's an error
    if (error) {
        return (
            <div className={styles.adminDashboard}>
                <DashboardHeader userEmail={userEmail} isAdmin={true} />
                <div className={styles.content}>
                    <div className={styles.error}>
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminDashboard}>
            <DashboardHeader userEmail={userEmail} isAdmin={true} />
            <div className={styles.content}>
                <h1>Admin Dashboard</h1>
                
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <i className="fas fa-money-bill-wave"></i>
                        <h3>Total Loans Funded</h3>
                        <p>{stats.totalLoansFunded}</p>
                    </div>
                    <div className={styles.statCard}>
                        <i className="fas fa-chart-line"></i>
                        <h3>Active Loans</h3>
                        <p>{stats.activeLoans}</p>
                    </div>
                    <div className={styles.statCard}>
                        <i className="fas fa-percentage"></i>
                        <h3>Average Interest Rate</h3>
                        <p>{stats.averageInterestRate}%</p>
                    </div>
                    <div className={styles.statCard}>
                        <i className="fas fa-shield-alt"></i>
                        <h3>Total Collateral Value</h3>
                        <p>{formatCurrency(stats.totalCollateralValue)}</p>
                    </div>
                    <div className={styles.statCard}>
                        <i className="fas fa-coins"></i>
                        <h3>Platform Earnings</h3>
                        <p>{formatCurrency(stats.platformEarnings)}</p>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <h2>Current Loans</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.loansTable}>
                            <thead>
                                <tr>
                                    <th>Borrower</th>
                                    <th>Lender</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map(loan => (
                                    <tr key={loan.id}>
                                        <td>{loan.borrower}</td>
                                        <td>{loan.lender}</td>
                                        <td>{formatCurrency(loan.amount)}</td>
                                        <td>
                                            <span className={`${styles.status} ${styles[loan.status.toLowerCase()]}`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className={styles.viewButton}
                                                onClick={() => navigate(`/loans/${loan.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.adminActions}>
                    <button 
                        className={styles.actionButton}
                        onClick={() => navigate('/admin/users')}
                    >
                        <i className="fas fa-users"></i>
                        View All Registered Users
                    </button>
                    <button 
                        className={styles.actionButton}
                        onClick={() => navigate('/admin/suspicious-accounts')}
                    >
                        <i className="fas fa-user-shield"></i>
                        Flag or Ban Suspicious Accounts
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 