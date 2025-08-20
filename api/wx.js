import { TextDecoder } from "util";

export const config = {
  api: {
    bodyParser: false, // 关闭默认 bodyParser，直接获取原始 body
  },
};

export default async function handler(req, res) {
  console.log("收到请求:", req.method, req.query);

  if (req.method === "GET") {
    // GET 请求，返回 echostr 或 "ok"
    const { echostr } = req.query;
    console.log("GET 请求 echostr:", echostr);
    res.status(200).send(echostr || "ok");
  } else if (req.method === "POST") {
    // 直接获取原始 Buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);
    const body = new TextDecoder("utf-8").decode(rawBody);
    console.log("📩 收到 POST 消息:", body);

    // 简单提取 FromUserName / ToUserName
    const toUserMatch = body.match(/<FromUserName><!\[CDATA\[(.+?)\]\]><\/FromUserName>/);
    const fromUserMatch = body.match(/<ToUserName><!\[CDATA\[(.+?)\]\]><\/ToUserName>/);
    const toUser = toUserMatch ? toUserMatch[1] : "user";
    const fromUser = fromUserMatch ? fromUserMatch[1] : "server";

    // 固定回复
    const reply = `
      <xml>
        <ToUserName><![CDATA[${toUser}]]></ToUserName>
        <FromUserName><![CDATA[${fromUser}]]></FromUserName>
        <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[收到消息！]]></Content>
      </xml>
    `;
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(reply);
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
