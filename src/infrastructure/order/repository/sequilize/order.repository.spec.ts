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
    await sequelize.sync();
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

  it("should find one a order", async () => {
    
  })
  it("should find all the orders", async () => {

  })
});
