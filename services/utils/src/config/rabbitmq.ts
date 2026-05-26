import amqp from 'amqplib'


// 👉 It is:
// Connecting your app to RabbitMQ
// Creating a channel (communication line)
// Creating a queue (message box)
// Making it reusable in your app


let channel: amqp.Channel;

export const connectRabbitMQ = async() => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);

    channel = await connection.createChannel();

    await channel.assertQueue(process.env.PAYMENT_QUEUE!, {
        durable: true,
    });

    console.log("🐇 connected to Rabbitmq");
};


export const getChannel = () => channel;