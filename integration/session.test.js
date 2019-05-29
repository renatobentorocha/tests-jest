const request = require("supertest");
const nodemailer = require("nodemailer");
const app = require("../../src/index");
const { User } = require("../../src/app/models");
const truncate = require("../utils/truncate");
const factory = require("../factories");

jest.mock("nodemailer");

const transport = {
  sendMail: jest.fn()
};

describe("Authentication", () => {
  beforeEach(async () => {
    await truncate();
  });

  beforeAll(() => {
    nodemailer.createTransport.mockReturnValue(transport);
  });

  it("should be able to authenticate with valid credentials", async () => {
    const user = await factory.create("User", {
      email: "renato@gmail.com",
      password: "123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: "renato@gmail.com",
        password: "123"
      });

    expect(response.status).toBe(200);
  });

  it("should not be able to authenticate with invalid credentials", async () => {
    const user = await factory.create("User", {
      email: "renato@gmail.com",
      password: "123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: "renato@gmail.com",
        password: "123999"
      });

    expect(response.status).toBe(401);
  });

  it("should return jwt token authenticated", async () => {
    const user = await factory.create("User", {
      email: "renato@gmail.com",
      password: "123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: "renato@gmail.com",
        password: "123"
      });

    expect(response.body).toHaveProperty("token");
  });

  it("should be able to access private routes when authenticated", async () => {
    const user = await factory.create("User", {
      email: "renato@gmail.com",
      password: "123"
    });

    const response = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearear ${user.generateToken()}`);

    expect(response.status).toBe(200);
  });

  it("should be not able to access private routes when not authenticated", async () => {
    const response = await request(app).get("/dashboard");

    expect(response.status).toBe(401);
  });

  it("should be not able to access private routes when use a invalid token", async () => {
    const response = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearear 123123`);

    expect(response.status).toBe(401);
  });

  it("should receive e-mail when authenticated ", async () => {
    const user = await factory.create("User", {
      email: "renato@gmail.com",
      password: "123"
    });

    const response = await request(app)
      .post("/sessions")
      .send({
        email: "renato@gmail.com",
        password: "123"
      });

    expect(transport.sendMail).toHaveBeenCalledTimes(1);
  });
});
