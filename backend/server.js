const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');
const connectDatabase = require('./config/database');

connectDatabase();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
});