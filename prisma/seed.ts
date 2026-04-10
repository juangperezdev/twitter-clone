import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding fake data...');

  // 1. Create 10 Users
  const usersToCreate = Array.from({ length: 10 }).map(() => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      email: faker.internet.email({ firstName, lastName }),
      password: 'password123', // Hardcoded standard password
      username: faker.internet.username({ firstName, lastName }).toLowerCase(),
      name: `${firstName} ${lastName}`,
      bio: faker.person.bio(),
      avatar: faker.image.avatar(),
    };
  });

  const createdUsers = [];
  for (const userData of usersToCreate) {
    const user = await prisma.user.create({ data: userData });
    createdUsers.push(user);
  }

  // 2. Create Tweets for each user
  const tweets = [];
  for (const user of createdUsers) {
    const numTweets = faker.number.int({ min: 1, max: 5 }); // 1 to 5 tweets per user
    for (let i = 0; i < numTweets; i++) {
      const tweet = await prisma.tweet.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 3 }).substring(0, 280),
          authorId: user.id,
        },
      });
      tweets.push(tweet);
    }
  }

  // 3. Create Follows (cross-follows)
  for (const user of createdUsers) {
    const numFollows = faker.number.int({ min: 2, max: 5 });
    // Random users to follow, excluding self
    const potentialFollows = createdUsers.filter(u => u.id !== user.id);
    const shuffled = potentialFollows.sort(() => 0.5 - Math.random());
    const toFollow = shuffled.slice(0, numFollows);

    for (const followedUser of toFollow) {
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: followedUser.id,
        },
      });
    }
  }

  // 4. Create Likes (cross-likes on tweets)
  for (const user of createdUsers) {
    const numLikes = faker.number.int({ min: 3, max: 10 });
    const shuffledTweets = [...tweets].sort(() => 0.5 - Math.random());
    const tweetsToLike = shuffledTweets.slice(0, numLikes);

    for (const tweet of tweetsToLike) {
      // Prevent double likes by checking
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_tweetId: {
            userId: user.id,
            tweetId: tweet.id,
          },
        },
      });

      if (!existingLike) {
        await prisma.like.create({
          data: {
            userId: user.id,
            tweetId: tweet.id,
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
  console.log(`Created ${createdUsers.length} users, ${tweets.length} tweets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
