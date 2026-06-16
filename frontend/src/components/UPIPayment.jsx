import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { MdAccountBalanceWallet } from 'react-icons/md';
import { paymentService } from '../services/api';
import './UPIPayment.css';

const UPIPayment = ({ totalAmount, onPaymentSuccess, onCancel }) => {
  const [paymentState, setPaymentState] = useState('SELECT'); // SELECT, PAYING, VERIFYING, SUCCESS
  const [selectedApp, setSelectedApp] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // UPI Details (Placeholders - Should ideally come from config/env)
  const UPI_ID = "milanparking@upi";
  const BUSINESS_NAME = "Milan Parking";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  const upiApps = [
    { 
      id: 'gpay', 
      name: 'Google Pay', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M34.5 24c0-1.4-.1-2.4-.4-3.5H24v6.6h5.9c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-8.9z"/>
          <path fill="#34A853" d="M24 34.5c2.8 0 5.2-.9 6.9-2.5l-3.3-2.6c-.9.6-2.1 1-3.6 1-2.7 0-5.1-1.8-5.9-4.3h-3.5v2.7c1.7 3.4 5.2 5.7 9.4 5.7z"/>
          <path fill="#FBBC05" d="M18.1 26.1c-.2-.6-.3-1.3-.3-2.1s.1-1.5.3-2.1v-2.7h-3.5c-.6 1.2-.9 2.6-.9 4.8s.3 3.6.9 4.8l3.5-2.7z"/>
          <path fill="#EA4335" d="M24 17.5c1.5 0 2.9.5 4 1.5l3-3c-2.1-2-4.9-3.2-7-3.2-4.2 0-7.7 2.3-9.4 5.7l3.5 2.7c.8-2.5 3.1-4.2 5.9-4.2z"/>
        </svg>
      ), 
      color: '#4285F4' 
    },
    { 
      id: 'phonepe', 
      name: 'PhonePe', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 512 512">
          <path fill="#5f259f" d="M432 32H80C53.5 32 32 53.5 32 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"/>
          <path fill="#fff" d="M352 160h-64v64h64v-64zm-96 0h-64v64h64v-64zm-96 0H96v64h64v-64zm192 96h-64v64h64v-64zm-96 0h-64v64h64v-64zm-96 0H96v64h64v-64zm192 96h-64v64h64v-64zm-96 0h-64v64h64v-64zm-96 0H96v64h64v-64z"/>
          <path fill="#fff" d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm0 192c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"/>
        </svg>
      ), 
      color: '#5f259f' 
    },
    { 
      id: 'paytm', 
      name: 'Paytm', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 100 100">
          <rect width="100" height="100" rx="15" fill="#00baf2"/>
          <path fill="#fff" d="M20 30h15v10H20zM40 30h15v10H40zM60 30h15v10H60zM20 45h15v10H20zM40 45h15v10H40zM60 45h15v10H60zM20 60h15v10H20zM40 60h15v10H40zM60 60h15v10H60z"/>
          <text x="50" y="85" textAnchor="middle" fill="#fff" style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'Arial' }}>Paytm</text>
        </svg>
      ), 
      color: '#00baf2' 
    },
    { 
      id: 'upi', 
      name: 'Any UPI App', 
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ), 
      color: '#1a73e8' 
    },
  ];

  const generateUPILink = () => {
    return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${totalAmount}&cu=INR`;
  };

  const handleAppSelect = (app) => {
    setSelectedApp(app);
    setPaymentState('PAYING');

    if (isMobile) {
      // Trigger deep link on mobile
      const upiLink = generateUPILink();
      window.location.href = upiLink;
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentState('VERIFYING');
    
    try {
      const payload = {
        amount: totalAmount,
        paymentMethod: selectedApp ? selectedApp.name : 'UPI',
        paymentStatus: 'Paid',
      };

      const response = await paymentService.confirmPayment(payload);
      
      if (response.status === 200 || response.status === 201) {
        setPaymentState('SUCCESS');
        toast.success('Payment confirmed successfully!');
        if (onPaymentSuccess) {
          setTimeout(() => onPaymentSuccess(response.data), 2000);
        }
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify payment. Please try again.');
      setPaymentState('PAYING');
    }
  };

  const renderSelect = () => (
    <div className="upi-select-container">
      <h3 className="upi-title">Select Payment App</h3>
      <div className="upi-apps-grid">
        {upiApps.map((app) => (
          <button
            key={app.id}
            className="upi-app-card"
            onClick={() => handleAppSelect(app)}
          >
            <span className="upi-app-icon" style={{ color: app.color }}>{app.icon}</span>
            <span className="upi-app-name">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPaying = () => (
    <div className="upi-paying-container">
      <button className="upi-back-btn" onClick={() => setPaymentState('SELECT')}>
        <FaArrowLeft /> Back
      </button>
      
      <div className="upi-qr-section">
        {!isMobile ? (
          <>
            <p className="upi-qr-text">Scan the QR code with your UPI app</p>
            <div className="upi-qr-wrapper">
              <QRCodeSVG value={generateUPILink()} size={200} level="H" includeMargin={true} />
            </div>
          </>
        ) : (
          <div className="upi-mobile-instruction">
            <p>Please complete the payment in your selected UPI app.</p>
          </div>
        )}
      </div>

      <div className="upi-instructions">
        <h4>Payment Instructions:</h4>
        <ol>
          <li>Open your UPI app</li>
          <li>Complete the payment of <strong>₹{totalAmount}</strong></li>
          <li>Once done, return to this screen</li>
          <li>Click the button below to confirm</li>
        </ol>
      </div>

      <button className="upi-paid-btn" onClick={handleConfirmPayment}>
        I HAVE PAID
      </button>
    </div>
  );

  const renderVerifying = () => (
    <div className="upi-verifying-container">
      <div className="upi-loader">
        <FaSpinner className="spinner-icon" />
      </div>
      <h3>Verifying Payment...</h3>
      <p>Please wait while we confirm your transaction.</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="upi-success-container">
      <div className="upi-success-icon">
        <FaCheckCircle />
      </div>
      <h3>Payment Successful!</h3>
      <p>Your parking slot has been booked.</p>
      <div className="upi-amount-badge">₹{totalAmount} Paid</div>
    </div>
  );

  return (
    <div className="upi-payment-card">
      <div className="upi-payment-header">
        <div className="upi-amount-display">
          <span className="label">Total Amount</span>
          <span className="amount">₹{totalAmount}</span>
        </div>
      </div>

      <div className="upi-payment-body">
        {paymentState === 'SELECT' && renderSelect()}
        {paymentState === 'PAYING' && renderPaying()}
        {paymentState === 'VERIFYING' && renderVerifying()}
        {paymentState === 'SUCCESS' && renderSuccess()}
      </div>

      {paymentState === 'SELECT' && onCancel && (
        <button className="upi-cancel-btn" onClick={onCancel}>
          Cancel Payment
        </button>
      )}
    </div>
  );
};

export default UPIPayment;
