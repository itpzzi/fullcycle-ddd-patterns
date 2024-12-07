import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderFactory from "../../../../domain/checkout/factory/order.factory";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({ where: { id }, rejectOnEmpty: true, include: ["items"] });
    } catch (error) {
      throw new Error("Order not found")
    }

    const props = {
      id,
      customerId: orderModel.customer_id,
      items: orderModel.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        productId: item.product_id,
        quantity: item.quantity
      }))
    };
    return OrderFactory.create(props)
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [{
        model: OrderItemModel,
        as: 'items',
        required: false
      }]
    });

    return orderModels.map(orderModel => {
      const orderItems = orderModel.items.map(item =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
        )
      );

      return new Order(
        orderModel.id,
        orderModel.customer_id,
        orderItems
      );
    });
  }

  async create(entity: Order): Promise<void> {
    const order = await OrderModel.create({
      id: entity.id,
      customer_id: entity.customerId,
      total: entity.total(),
    });


    const items = entity.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      product_id: item.productId,
      quantity: item.quantity,
      order_id: entity.id
    }));

    await OrderItemModel.bulkCreate(items);
  }

  async update(entity: Order): Promise<void> {
    await OrderItemModel.destroy({
      where: { order_id: entity.id }
    });

    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total()
      },
      {
        where: { id: entity.id }
      }
    );

    await OrderItemModel.bulkCreate(
      entity.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
        order_id: entity.id
      }))
    );
  }
}
