export default function handler(req, res) {
  console.log("收到请求:", req.method, req.query);

  if (req.method === "GET") {
    // 忽略 signature，直接返回 echostr 或 "ok"
    const { echostr } = req.query;
    console.log("GET 请求 echostr:", echostr);
    res.status(200).send(echostr || "ok");
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
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
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
