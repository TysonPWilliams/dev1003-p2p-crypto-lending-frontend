import React, { useState, useEffect } from 'react';
import styles from '../styles/AdminDashboard.module.css';
import loadingStyles from '../styles/Loading.module.css';
import DashboardHeader from '../components/DashboardHeader';
import Footer from '../components/Footer';

function maskName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.map(part =>
    part.length <= 2
      ? part[0] + '*'
      : part.slice(0, 2) + '*'.repeat(Math.max(1, part.length - 2))
  ).join(' ');
}

function maskEmail(email) {
  if (!email) return '';
  const [user, domainFull] = email.split('@');
  const [domain, ...tldParts] = domainFull.split('.');
  const tld = tldParts.length ? '.' + tldParts.join('.') : '';
  const maskedUser = user.slice(0, 2) + '*'.repeat(Math.max(1, user.length - 2));
  const maskedDomain = domain.slice(0, 2) + '*'.repeat(Math.max(1, domain.length - 2));
  return maskedUser + '@' + maskedDomain + tld;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          setUserEmail(tokenData.email);
          setUserId(tokenData.sub || tokenData.id || tokenData._id || tokenData.userId || '');
        }
      } catch {
        setError('Failed to decode user token');
        setLoading(false);
        return;
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://dev1003-p2p-crypto-lending-backend.onrender.com/transactions/user/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          mode: 'cors',
        });
        if (res.status === 404) {
          setTransactions([]);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch transactions');
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : [data]);
      } catch (err) {
        setError(err.message || 'Error loading transactions');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchTransactions();
  }, [userId]);

  // Debug: log userId and transactions
  console.log('userId:', userId, 'transactions:', transactions);

  // Outgoing: all you sent (fromUser is you)
  const outgoing = transactions.filter(
    t => t.fromUser && String(t.fromUser._id) === String(userId)
  );
  // Incoming: all you received (toUser is you)
  const incoming = transactions.filter(
    t => t.toUser && String(t.toUser._id) === String(userId)
  );
  // Debug: log outgoing and incoming
  console.log('outgoing:', outgoing, 'incoming:', incoming);

  // Helper to display user (mask name/email)
  const displayUser = user => {
    if (!user) return '';
    if (user.name) return maskName(user.name);
    if (user.email) return maskEmail(user.email);
    return 'User';
  };

  // Helper to display currency (fromWallet/toWallet may have currency info, fallback to BTC)
  const displayCurrency = t => {
    if (t.currency) return t.currency;
    if (t.fromWallet && t.fromWallet.currency) return t.fromWallet.currency;
    if (t.toWallet && t.toWallet.currency) return t.toWallet.currency;
    return 'BTC';
  };

  // Helper to display date
  const displayDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Helper to display paid/received
  const displayStatus = s => s ? 'Yes' : 'No';

  // Helper to display type
  const displayType = t => t.isLoanRepayment ? 'Repayment' : 'Disbursement';

  if (loading) {
    return (
        <div className={loadingStyles.mainContainer}>
            <DashboardHeader userEmail={userEmail} />
            <main>
                <div className={loadingStyles.container}>
                    <div className={loadingStyles.spinner}></div>
                    <div className={loadingStyles.text}>Loading transactions...</div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

if (error) {
  return (
    <div className={styles.adminDashboard}>
      <DashboardHeader userEmail={userEmail} />
      <div className={styles.content}>
        <div style={{ color: '#ff4757', textAlign: 'center', fontSize: '1.2rem' }}>
          Error: {error}
        </div>
      </div>
      <Footer />
    </div>
  );
}

return (
  <div className={styles.adminDashboard}>
    <DashboardHeader userEmail={userEmail} />
    <div className={styles.content}>
      <h1>Transactions</h1>
      
      <div className={styles.tableContainer}>
        <h2>Outgoing Transactions</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.loansTable}>
            <thead>
              <tr>
                <th>To</th>
                <th>Currency</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Paid?</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {outgoing.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>No outgoing transactions</td></tr>
              ) : outgoing.map((t, idx) => (
                <tr key={idx}>
                  <td>{displayUser(t.toUser)}</td>
                  <td>{displayCurrency(t)}</td>
                  <td>{Number(t.amount).toFixed(8)}</td>
                  <td>{displayDate(t.expectedPaymentDate)}</td>
                  <td>
                    <span className={`${styles.status} ${t.paymentStatus ? styles.completed : styles.pending}`}>
                      {displayStatus(t.paymentStatus)}
                    </span>
                  </td>
                  <td>{displayType(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h2>Incoming Transactions</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.loansTable}>
            <thead>
              <tr>
                <th>From</th>
                <th>Currency</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Received?</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {incoming.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>No incoming transactions</td></tr>
              ) : incoming.map((t, idx) => (
                <tr key={idx}>
                  <td>{displayUser(t.fromUser)}</td>
                  <td>{displayCurrency(t)}</td>
                  <td>{Number(t.amount).toFixed(8)}</td>
                  <td>{displayDate(t.expectedPaymentDate)}</td>
                  <td>
                    <span className={`${styles.status} ${t.paymentStatus ? styles.completed : styles.pending}`}>
                      {displayStatus(t.paymentStatus)}
                    </span>
                  </td>
                  <td>{displayType(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);
};

export default Transactions; 