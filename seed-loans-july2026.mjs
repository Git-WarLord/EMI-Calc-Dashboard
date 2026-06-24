import mysql from 'mysql2/promise';

const loansData = [
  {
    name: 'OneCard (CC)',
    monthlyEMI: 4125,
    remainingEMIs: 5,
    dueDate: '9th',
    extraLoan: 0,
  },
  {
    name: 'OneCard Fridge',
    monthlyEMI: 2708,
    remainingEMIs: 4,
    dueDate: '9th',
    extraLoan: 0,
  },
  {
    name: 'Fibe',
    monthlyEMI: 5646,
    remainingEMIs: 3,
    dueDate: '5th',
    extraLoan: 0,
  },
  {
    name: 'KreditBee',
    monthlyEMI: 4651,
    remainingEMIs: 10,
    dueDate: '8th',
    extraLoan: 0,
  },
  {
    name: 'Kotak Mahindra',
    monthlyEMI: 4649,
    remainingEMIs: 5,
    dueDate: '5th',
    extraLoan: 0,
  },
  {
    name: 'mPokket',
    monthlyEMI: 1893,
    remainingEMIs: 6,
    dueDate: '2nd',
    extraLoan: 0,
  },
  {
    name: 'mMoney',
    monthlyEMI: 12910,
    remainingEMIs: 1,
    dueDate: '5th',
    extraLoan: 0,
  },
  {
    name: 'Navi',
    monthlyEMI: 4300,
    remainingEMIs: 16,
    dueDate: '1st',
    extraLoan: 0,
  },
  {
    name: 'Bike',
    monthlyEMI: 7818,
    remainingEMIs: 24,
    dueDate: '3rd',
    extraLoan: 0,
  },
];

// Calculate closing month for each loan based on remaining EMIs starting July 2026
function calculateClosingMonth(remainingEMIs) {
  const startDate = new Date(2026, 6, 1); // July 2026
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + remainingEMIs);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
}

async function seedLoans() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get the owner's user ID (assuming user ID 1 is the owner)
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    const userId = users[0]?.id || 1;
    
    console.log(`Using userId: ${userId}`);
    
    // Clear existing loans
    console.log('Clearing existing loans...');
    await connection.query('DELETE FROM loans WHERE userId = ?', [userId]);
    
    // Insert new loans
    console.log('Inserting corrected loans starting from July 2026...');
    
    for (const loan of loansData) {
      const closingMonth = calculateClosingMonth(loan.remainingEMIs);
      const totalRemaining = loan.monthlyEMI * loan.remainingEMIs;
      
      await connection.query(
        `INSERT INTO loans (userId, name, monthlyEMI, remainingEMIs, totalRemaining, dueDate, closesIn, extraLoan, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [userId, loan.name, loan.monthlyEMI, loan.remainingEMIs, totalRemaining, loan.dueDate, closingMonth, loan.extraLoan]
      );
      
      console.log(`✓ Seeded: ${loan.name} - ₹${loan.monthlyEMI} x ${loan.remainingEMIs} EMIs (closes ${closingMonth})`);
    }
    
    // Verify the data
    const [allLoans] = await connection.query('SELECT * FROM loans WHERE userId = ? ORDER BY dueDate', [userId]);
    console.log(`\n✓ Total loans seeded: ${allLoans.length}`);
    
    const totalEMI = allLoans.reduce((sum, loan) => sum + parseFloat(loan.monthlyEMI), 0);
    const totalRemaining = allLoans.reduce((sum, loan) => sum + parseFloat(loan.totalRemaining), 0);
    
    console.log(`✓ Total Monthly EMI: ₹${totalEMI.toLocaleString()}`);
    console.log(`✓ Total Outstanding: ₹${totalRemaining.toLocaleString()}`);
    
    console.log('\nLoans summary:');
    allLoans.forEach(loan => {
      console.log(`  ${loan.name}: ₹${loan.monthlyEMI} x ${loan.remainingEMIs} = ₹${loan.totalRemaining} (Due ${loan.dueDate}, closes ${loan.closesIn})`);
    });
    
  } catch (error) {
    console.error('Error seeding loans:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedLoans();
