const axios = require('axios');

async function testPayPal() {
  try {
    const response = await axios.post('http://localhost:5000/api/payments/create-paypal-order', {
      amount: 40,
      bookingDetails: {
        area: "CG Road",
        city: "Ahmedabad",
        slotNumber: 1
      }
    });
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error.response ? error.response.data : error.message);
  }
}

testPayPal();
