const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fatimatrinidad0513@gmail.com', // Replace with your Gmail address
    pass: 'qfgn iqpv rcsk xepk' // Replace with your Gmail password or app-specific password
  }
});

// Function to send order confirmation email
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  // Destructure the order details (already passed from frontend)
  const { subtotal, taxes, shippingFee, finalTotal, products, paymentMethod } = orderDetails;

  // Format the product details without the productId
  const productDetails = products
    .map(product => `${product.productName} - Quantity: ${product.quantity} - ₱${product.total.toFixed(2)} (₱${product.price} x ${product.quantity})`)
    .join('\n');

  // Create the email content with the details provided
  const emailContent = `
    Thank you for your ordering in ShoeSpot!

    Here are your order details:

    Products:
    ${productDetails}

    Subtotal: ₱${subtotal.toFixed(2)}
    Shipping: ₱${shippingFee.toFixed(2)}
    Taxes: ₱${taxes.toFixed(2)}
    Grand Total: ₱${finalTotal.toFixed(2)}

    Payment Method: ${paymentMethod}
  `;

  const mailOptions = {
    from: 'fatimatrinidad0513@gmail.com', // Replace with your Gmail address
    to: email,
    subject: 'Order Confirmation',
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error; // Propagate the error to the caller
  }
};

// Export the function
module.exports = sendOrderConfirmationEmail;