import EventDispatcher from "../../@shared/event/event-dispatcher";
import Address from "../value-object/address";
import Customer from "./customer";

describe("Customer unit tests", () => {
  it("should throw error when id is empty", () => {
    expect(() => {
      new Customer("", "John");
    }).toThrowError("Id is required");
  });

  it("should throw error when name is empty", () => {
    expect(() => {
      new Customer("123", "");
    }).toThrowError("Name is required");
  });

  it("should change name", () => {
    // Arrange
    const customer = new Customer("123", "John");

    // Act
    customer.changeName("Jane");

    // Assert
    expect(customer.name).toBe("Jane");
  });

  it("should activate customer", () => {
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 123, "13330-250", "São Paulo");
    customer.Address = address;

    customer.activate();

    expect(customer.isActive()).toBe(true);
  });

  it("should throw error when address is undefined when you activate a customer", () => {
    expect(() => {
      const customer = new Customer("1", "Customer 1");
      customer.activate();
    }).toThrowError("Address is mandatory to activate a customer");
  });

  it("should deactivate customer", () => {
    const customer = new Customer("1", "Customer 1");

    customer.deactivate();

    expect(customer.isActive()).toBe(false);
  });

  it("should add reward points", () => {
    const customer = new Customer("1", "Customer 1");
    expect(customer.rewardPoints).toBe(0);

    customer.addRewardPoints(10);
    expect(customer.rewardPoints).toBe(10);

    customer.addRewardPoints(10);
    expect(customer.rewardPoints).toBe(20);
  });

  it("should register all events when created", async () => {
    const eventDispatcher = new EventDispatcher()
    new Customer("1", "Customer 1", eventDispatcher);

    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"]).toBeDefined()
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length).toBe(2)
    expect(eventDispatcher.getEventHandlers["CustomerAddressChangedEvent"].length).toBe(1)
  })

  it("should console when created", async () => {
    const eventDispatcher = new EventDispatcher()
    const spyConsoleLog = jest.spyOn(console, "log")
    new Customer("1", "Customer 1", eventDispatcher);

    expect(spyConsoleLog).toHaveBeenCalledWith("Esse é o primeiro console.log do evento: CustomerCreated")
    expect(spyConsoleLog).toHaveBeenCalledWith("Esse é o segundo console.log do evento: CustomerCreated")
    expect(spyConsoleLog).toHaveBeenCalledTimes(2)
  })

  it("should console when address changes", async () => {
    const eventDispatcher = new EventDispatcher()
    const spyConsoleLog = jest.spyOn(console, "log")
    const customer = new Customer("C1", "Customer 1", eventDispatcher);
    const newAddress = new Address("Avenida Principal", 999, "12345-678", "São Paulo")
    customer.changeAddress(newAddress)

    expect(spyConsoleLog).toHaveBeenCalledWith("Endereço do cliente: C1 Customer 1 alterado para: Avenida Principal, 999, 12345-678 São Paulo")
    expect(spyConsoleLog).toHaveBeenCalledTimes(3)
  })
});
