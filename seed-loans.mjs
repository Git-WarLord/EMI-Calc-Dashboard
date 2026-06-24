import mysql from 'mysql2/promise';

const loansData = [
  {
    name: "OneCard (CC)",
    monthlyEMI: 4125,
    remainingEMIs: 5,
    totalRemaining: 20625,
    dueDate: "9th",
    closesIn: "Nov 2025"
  },
  {
    name: "OneCard Fridge",
    monthlyEMI: 2708,
    remainingEMIs: 4,
    totalRemaining: 10832,
    dueDate: "9th",
    closesIn: "Oct 2025"
  },
  {
    name: "Fibe",
    monthlyEMI: 5646,
    remainingEMIs: 3,
    totalRemaining: 16938,
    dueDate: "5th",
    closesIn: "Sep 2025"
  },
  {
    name: "KreditBee",
    monthlyEMI: 4651,
    remainingEMIs: 10,
    totalRemaining: 46510,
    dueDate: "8th",
    closesIn: "Apr 2026"
  },
  {
    name: "Kotak Mahindra",
    monthlyEMI: 4649,
    remainingEMIs: 5,
    totalRemaining: 23245,
    dueDate: "5th",
    closesIn: "Nov 2025"
  },
  {
    name: "mPokket",
    monthlyEMI: 1893,
    remainingEMIs: 6,
    totalRemaining: 11358,
    dueDate: "2nd",
    closesIn: "Dec 2025"
  },
  {
    name: "mMoney",
    monthlyEMI: 12910,
    remainingEMIs: 1,
    totalRemaining: 12910,
    dueDate: "5th",
    closesIn: "Jul 2025"
  },
  {
    name: "Navi",
    monthlyEMI: 4300,
    remainingEMIs: 16,
    totalRemaining: 68800,
    dueDate: "1st",
    closesIn: "Oct 2026"
  },
  {
    name: "Bike",
    monthlyEMI: 7818,
    remainingEMIs: 24,
    totalRemaining: 187632,
    dueDate: "3rd",
    closesIn: "Jun 2028"
  }
];

async function seedLoans() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Get the first user (usually the owner/admin)
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('No users found. Please create a user account first.');
      return;
    }

    const userId = users[0].id;
    console.log(`Seeding loans for user ID: ${userId}`);

    // Check if loans already exist
    const [existingLoans] = await connection.query('SELECT COUNT(*) as count FROM loans WHERE userId = ?', [userId]);
    
    if (existingLoans[0].count > 0) {
      console.log(`User already has ${existingLoans[0].count} loans. Skipping seeding.`);
      await connection.end();
      return;
    }

    // Insert loans
    for (const loan of loansData) {
      await connection.query(
        'INSERT INTO loans (userId, name, monthlyEMI, remainingEMIs, totalRemaining, dueDate, closesIn, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, loan.name, loan.monthlyEMI, loan.remainingEMIs, loan.totalRemaining, loan.dueDate, loan.closesIn, 'active']
      );
      console.log(`✓ Added loan: ${loan.name}`);
    }

    console.log(`\n✓ Successfully seeded ${loansData.length} loans!`);
  } catch (error) {
    console.error('Error seeding loans:', error.message);
  } finally {
    await connection.end();
  }
}

seedLoans();
