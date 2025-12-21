jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});


jest.mock("../admin/redisClient", () => {
  return {
    getClient: () => ({
      subscribe: jest.fn((_, cb) => cb && cb(null)),
      on: jest.fn(),
    }),
  };
});

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    chatMessage: {
      create: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({
        message: "Test notification",
        type: "INFO",
      }),
    },
  })),
}));


const ioClient = require("socket.io-client");
const { httpServer, io } = require("./server");

let userSocket;
let orgSocket;

beforeEach((done) => {
  userSocket = ioClient("http://localhost:4001", {
    transports: ["websocket"],
    forceNew: true,
  });

  orgSocket = ioClient("http://localhost:4001", {
    transports: ["websocket"],
    forceNew: true,
  });

  let connected = 0;
  const check = () => {
    connected++;
    if (connected === 2) done();
  };

  userSocket.on("connect", check);
  orgSocket.on("connect", check);
});

afterEach(() => {
  if (userSocket?.connected) userSocket.disconnect();
  if (orgSocket?.connected) orgSocket.disconnect();
});


afterAll(() => {
  io.close(); 
  httpServer.close(); 
});


describe("WebSocket API Testing", () => {
  test("User & Organization register + presence", (done) => {
    orgSocket.emit("register", { id: 101, role: "organization" });

    userSocket.on("online_orgs_list", (orgs) => {
      expect(orgs).toContain(101);
      done();
    });

    userSocket.emit("register", { id: 1, role: "user" });
  });

  test("User → Organization chat works", (done) => {
    orgSocket.emit("register", { id: 101, role: "organization" });
    userSocket.emit("register", { id: 1, role: "user" });

    orgSocket.on("receive_message", (data) => {
      expect(data.message).toBe("Hello Org");
      done();
    });

    userSocket.emit("send_message", {
      senderId: 1,
      senderRole: "USER",
      receiverId: 101,
      receiverRole: "organization",
      message: "Hello Org",
    });
  });

  test("Admin notification works", (done) => {
    userSocket.emit("identify");

    userSocket.on("admin:notification", (data) => {
      expect(data.message).toBe("Test notification");
      done();
    });

    userSocket.emit("admin:notify", {
      message: "Admin Alert",
      type: "INFO",
    });
  });

  test("Disconnect updates presence", (done) => {

  userSocket.emit("register", { id: 1, role: "user" });

  userSocket.on("org_status", (data) => {
    if (data.status === true) return;

  
    expect(data.orgId).toBe(101);
    expect(data.status).toBe(false);
    done();
  });

  orgSocket.emit("register", { id: 101, role: "organization" });

  setTimeout(() => {
    orgSocket.disconnect();
  }, 50);
});
});