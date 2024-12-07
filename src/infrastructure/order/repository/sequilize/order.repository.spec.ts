import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await OrderItemModel.destroy({ where: {} });
    await OrderModel.destroy({ where: {} });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update a order", async () => {
    const customerRepository = new CustomerRepository();

    const customerC1 = new Customer("C1", "Customer 1");
    customerC1.changeAddress(new Address("Street C1", 1, "Zipcode C1", "City C1"));

    const customerC2 = new Customer("C2", "Customer 2");
    customerC2.changeAddress(new Address("Street C2", 2, "Zipcode C2", "City C2"));

    await customerRepository.create(customerC1);
    await customerRepository.create(customerC2);

    const productRepository = new ProductRepository();
    const product = new Product("p2", "Product 2", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "oi1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("o1", customerC1.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    order.changeCustomerId(customerC2.id)
    await orderRepository.update(order)

    const orderUpdated = await OrderModel.findOne({ where: { id: "o1" }, include: ["items"] })

    expect(orderUpdated.toJSON()).toStrictEqual({
      id: "o1",
      customer_id: "C2",
      total: order.total(),
      items: [
        {
          id: "oi1",
          name: "Product 2",
          order_id: "o1",
          price: 10,
          product_id: "p2",
          quantity: 2,
        },
      ]
    })
  })

  it("should find one order", async () => {
    const customerRepository = new CustomerRepository()
    const productRepository = new ProductRepository()
    const orderRepository = new OrderRepository()

    const customerC1 = new Customer("C1", "Customer 1");
    customerC1.changeAddress(new Address("Street C1", 1, "Zipcode C1", "City C1"));
    await customerRepository.create(customerC1);

    const productP1 = new Product("p1", "Product 1", 10);
    await productRepository.create(productP1);

    const orderItem = new OrderItem(
      "oi1",
      productP1.name,
      productP1.price,
      productP1.id,
      2
    );
    const order = new Order("o1", customerC1.id, [orderItem]);
    await orderRepository.create(order);

    const orderSaved = await orderRepository.find("o1")
    expect(orderSaved.id).toBe("o1")
    expect(orderSaved.customerId).toBe("C1")
    expect(orderSaved.items.length).toBe(1)
    expect(orderSaved.total()).toBe(20)
  })

  it("should throw an error when order is not found", async () => {
    const orderRepository = new OrderRepository()

    expect(async () => {
      await orderRepository.find("o1")
    }).rejects.toThrow("Order not found")
  })

  it("should find all the orders", async () => {
    const customerRepository = new CustomerRepository()
    const productRepository = new ProductRepository()
    const orderRepository = new OrderRepository()

    const customerC1 = new Customer("C1", "Customer 1");
    customerC1.changeAddress(new Address("Street C1", 1, "Zipcode C1", "City C1"));
    await customerRepository.create(customerC1);

    const productP1 = new Product("p1", "Product 1", 10);
    await productRepository.create(productP1);

    const orderItem1 = new OrderItem(
      "oi1",
      productP1.name,
      productP1.price,
      productP1.id,
      2
    );
    const orderItem2 = new OrderItem(
      "oi2",
      productP1.name,
      productP1.price,
      productP1.id,
      2
    );
    const orderO1 = new Order("o1", customerC1.id, [orderItem1]);
    const orderO2 = new Order("o2", customerC1.id, [orderItem2]);

    try {
      await orderRepository.create(orderO1);
      await orderRepository.create(orderO2);

      const orders = await orderRepository.findAll()
      console.log('Found orders:', JSON.stringify(orders, null, 2));

      expect(orders).toHaveLength(2);

      expect(orders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "o1",
            customerId: customerC1.id,
            items: [
              expect.objectContaining({
                id: "oi1",
                name: productP1.name,
                price: productP1.price,
                productId: productP1.id,
                quantity: 2
              })
            ]
          }),
          expect.objectContaining({
            id: "o2",
            customerId: customerC1.id,
            items: [
              expect.objectContaining({
                id: "oi2",
                name: productP1.name,
                price: productP1.price,
                productId: productP1.id,
                quantity: 2
              })
            ]
          })
        ])
      );
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  })
});
