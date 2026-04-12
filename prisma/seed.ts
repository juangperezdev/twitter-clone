import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Limpiando base de datos...');
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creando usuarios...');

  const hashedPassword = await bcrypt.hash('Password1!', 10);

  // Usuario de prueba conocido (para los evaluadores)
  const testUser = await prisma.user.create({
    data: {
      email: 'demo@flock.com',
      password: hashedPassword,
      username: 'demo',
      name: 'Usuario Demo',
      bio: 'Cuenta de demostración para evaluadores de The Flock.',
      avatar: null,
    }
  });

  // 10 usuarios adicionales con datos realistas
  const userPromises = Array.from({ length: 10 }).map(async () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
      .username({ firstName, lastName })
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 15);

    return prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: hashedPassword,
        username,
        name: `${firstName} ${lastName}`,
        bio: faker.person.bio(),
        avatar: null,
      }
    });
  });

  const fakeUsers = await Promise.all(userPromises);
  const allUsers = [testUser, ...fakeUsers];

  console.log(`✅ ${allUsers.length} usuarios creados`);

  // Crear tweets para cada usuario (2-6 por persona)
  console.log('💬 Creando tweets...');
  const tweets = [];
  for (const user of allUsers) {
    const numTweets = faker.number.int({ min: 2, max: 6 });
    for (let i = 0; i < numTweets; i++) {
      const tweet = await prisma.tweet.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 3 }).substring(0, 280),
          authorId: user.id,
          createdAt: faker.date.recent({ days: 30 }),
        },
      });
      tweets.push(tweet);
    }
  }
  console.log(`✅ ${tweets.length} tweets creados`);

  // Crear follows cruzados
  console.log('🤝 Creando follows...');
  let followCount = 0;
  for (const user of allUsers) {
    const numFollows = faker.number.int({ min: 3, max: 7 });
    const potentialFollows = allUsers.filter(u => u.id !== user.id);
    const shuffled = potentialFollows.sort(() => 0.5 - Math.random());
    const toFollow = shuffled.slice(0, numFollows);

    for (const followedUser of toFollow) {
      try {
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followingId: followedUser.id,
          },
        });
        followCount++;
      } catch {
        // Ignorar duplicados
      }
    }
  }
  console.log(`✅ ${followCount} follows creados`);

  // Crear likes cruzados
  console.log('❤️ Creando likes...');
  let likeCount = 0;
  for (const user of allUsers) {
    const numLikes = faker.number.int({ min: 5, max: 15 });
    const shuffledTweets = [...tweets].sort(() => 0.5 - Math.random());
    const tweetsToLike = shuffledTweets.slice(0, numLikes);

    for (const tweet of tweetsToLike) {
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_tweetId: { userId: user.id, tweetId: tweet.id },
        },
      });

      if (!existingLike) {
        await prisma.like.create({
          data: { userId: user.id, tweetId: tweet.id },
        });
        likeCount++;
      }
    }
  }
  console.log(`✅ ${likeCount} likes creados`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('📋 Credenciales de prueba:');
  console.log('   Email: demo@flock.com');
  console.log('   Password: Password1!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
