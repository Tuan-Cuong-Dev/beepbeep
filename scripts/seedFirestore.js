// Viết script import dữ liệu (chạy từ code)

// scripts/seedFirestore.js
import { db } from '../src/firebase/firebaseConfig'; // đường dẫn đúng với cấu trúc thư mục
import {
  collection,
  addDoc,
} from "firebase/firestore"

const roles = ["admin", "staff", "technician"];
const bikeBrands = ["VinFast", "Yadea", "Dat Bike", "Gogoro"];
const bikeModels = ["Klara", "Xmen", "WeeGo", "Pega"];
const paymentMethods = ["momo", "vnpay", "cash"];
const orderStatus = ["ongoing", "completed", "cancelled"];
const maintenanceStatus = ["pending", "done"];

const getRandomLocation = () => ({
  lat: 16.047 + Math.random() * 0.01,
  lng: 108.206 + Math.random() * 0.01,
});

// 👤 USERS
const generateUsers = (n) =>
  Array.from({ length: n }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('09########'),
    role: faker.helpers.arrayElement(roles),
    createdAt: now,
    updatedAt: now,
  }));

// 👨‍💼 CUSTOMERS
const generateCustomers = (n) =>
  Array.from({ length: n }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('09########'),
    idNumber: faker.string.numeric(9),
    driverLicense: `A1_${faker.string.numeric(3)}`,
    createdAt: now,
    updatedAt: now,
  }));

// 🛵 EBIKES
const generateEbikes = (n) =>
  Array.from({ length: n }, () => ({
    licensePlate: `43${faker.string.alpha({ length: 1 })}${faker.string.numeric(2)}-${faker.string.numeric(3)}.${faker.string.numeric(2)}`,
    brand: faker.helpers.arrayElement(bikeBrands),
    model: faker.helpers.arrayElement(bikeModels),
    status: faker.helpers.arrayElement(["available", "rented", "maintenance"]),
    batteryLevel: faker.number.int({ min: 10, max: 100 }),
    location: getRandomLocation(),
    createdAt: now,
    updatedAt: now,
  }));

// 📦 RENTAL ORDERS
const generateRentalOrders = (n, customers, bikes) =>
  Array.from({ length: n }, () => {
    const start = faker.date.recent();
    const end = new Date(start.getTime() + 1.5 * 60 * 60 * 1000); // +1.5h

    return {
      customerId: faker.helpers.arrayElement(customers).id || "",
      eBikeId: faker.helpers.arrayElement(bikes).id || "",
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      status: faker.helpers.arrayElement(orderStatus),
      price: faker.number.int({ min: 50000, max: 200000 }),
      pickupLocation: faker.location.streetAddress(),
      dropoffLocation: faker.location.streetAddress(),
      createdAt: now,
    };
  });

// 🛠 MAINTENANCE LOGS
const generateMaintenanceLogs = (n, bikes, users) =>
  Array.from({ length: n }, () => ({
    eBikeId: faker.helpers.arrayElement(bikes).id || "",
    description: faker.vehicle.vrm(), // hoặc mô tả ngẫu nhiên
    status: faker.helpers.arrayElement(maintenanceStatus),
    createdBy: faker.helpers.arrayElement(users).id || "",
    createdAt: now,
  }));

// 💸 PAYMENTS
const generatePayments = (n, orders) =>
  Array.from({ length: n }, () => {
    const order = faker.helpers.arrayElement(orders);
    return {
      orderId: order.id || "",
      amount: order.price,
      method: faker.helpers.arrayElement(paymentMethods),
      status: "paid",
      createdAt: now,
    };
  });

const seedCollection = async (collectionName, dataArray) => {
  const createdDocs = [];
  for (const data of dataArray) {
    const docRef = await addDoc(collection(db, collectionName), data);
    createdDocs.push({ ...data, id: docRef.id });
    console.log(`✅ ${collectionName}: ${docRef.id}`);
  }
  return createdDocs;
};

const runSeed = async () => {
  try {
    const users = await seedCollection("users", generateUsers(5));
    const customers = await seedCollection("customers", generateCustomers(10));
    const ebikes = await seedCollection("ebikes", generateEbikes(8));
    const rentalOrders = await seedCollection("rentalOrders", generateRentalOrders(10, customers, ebikes));
    const maintenanceLogs = await seedCollection("maintenanceLogs", generateMaintenanceLogs(5, ebikes, users));
    const payments = await seedCollection("payments", generatePayments(5, rentalOrders));

    console.log("✅ Dữ liệu đã được seed đầy đủ.");
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
  }
};

runSeed();
