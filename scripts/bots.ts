const API_URL = process.env.API_URL || 'http://localhost:3000/api';

interface Bot {
  id: string;
  username: string;
  balance: number;
}

async function api(path: string, method = 'GET', body?: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function createBot(index: number): Promise<Bot> {
  const username = `bot_${index}_${Date.now()}`;
  const user = await api('/users', 'POST', { username });
  await api(`/users/${user._id}/deposit`, 'POST', { amount: 10000 });
  const updated = await api(`/users/${user._id}`);
  return { id: updated._id, username, balance: updated.balance };
}

async function placeBid(bot: Bot, auctionId: string, amount: number) {
  try {
    const result = await api('/bids', 'POST', {
      auctionId,
      userId: bot.id,
      amount
    });
    console.log(`${bot.username} bid ${amount}: ${result.error || 'OK'}`);
    return result;
  } catch (e) {
    console.error(`${bot.username} failed:`, e);
  }
}

async function runLoadTest(auctionId: string, botCount: number, rounds: number) {
  console.log(`Creating ${botCount} bots...`);
  const bots = await Promise.all(
    Array.from({ length: botCount }, (_, i) => createBot(i))
  );
  console.log('Bots created');

  for (let round = 0; round < rounds; round++) {
    console.log(`\n--- Round ${round + 1} ---`);

    const state = await api(`/auctions/${auctionId}/state`);
    console.log(`Current min winning bid: ${state.minWinningBid}`);

    const bidPromises = bots.map((bot, i) => {
      const amount = state.minWinningBid + (i + 1) * 10 + Math.floor(Math.random() * 50);
      return placeBid(bot, auctionId, amount);
    });

    await Promise.all(bidPromises);
    await new Promise(r => setTimeout(r, 1000));
  }

  const finalState = await api(`/auctions/${auctionId}/state`);
  console.log('\n--- Final State ---');
  console.log(`Leaderboard: ${finalState.leaderboard.length} bids`);
  console.log(`Top 5:`, finalState.leaderboard.slice(0, 5));
}

async function runAntiSnipingTest(auctionId: string) {
  console.log('Creating sniper bot...');
  const sniper = await createBot(999);

  const checkAndSnipe = async () => {
    const state = await api(`/auctions/${auctionId}/state`);
    if (state.timeLeft < 5000 && state.timeLeft > 0) {
      console.log(`Sniping at ${state.timeLeft}ms left!`);
      await placeBid(sniper, auctionId, state.minWinningBid + 100);

      const newState = await api(`/auctions/${auctionId}/state`);
      console.log(`Time extended: ${newState.timeLeft}ms`);
    }
  };

  const interval = setInterval(checkAndSnipe, 500);
  setTimeout(() => clearInterval(interval), 60000);
}

const [,, command, auctionId, ...args] = process.argv;

if (command === 'load') {
  const botCount = parseInt(args[0]) || 10;
  const rounds = parseInt(args[1]) || 3;
  runLoadTest(auctionId, botCount, rounds);
} else if (command === 'snipe') {
  runAntiSnipingTest(auctionId);
} else {
  console.log('Usage:');
  console.log('  npx tsx scripts/bots.ts load <auctionId> [botCount] [rounds]');
  console.log('  npx tsx scripts/bots.ts snipe <auctionId>');
}
