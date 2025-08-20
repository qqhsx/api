// api/wx.js 临时调试版
export default function handler(req, res) {
  console.log("收到请求:", req.method, req.query);

  if (req.method === "GET") {
    // 直接返回 echostr，忽略 signature
    const { echostr } = req.query;
    res.status(200).send(echostr || "ok");
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      console.log("收到 POST 消息:", body);

      // 固定回复文本
      const toUserMatch = body.match(/<FromUserName><!\[CDATA\[(.+?)\]\]><\/FromUserName>/);
      const fromUserMatch = body.match(/<ToUserName><!\[CDATA\[(.+?)\]\]><\/ToUserName>/);
      const toUser = toUserMatch ? toUserMatch[1] : "user";
      const fromUser = fromUserMatch ? fromUserMatch[1] : "server";

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
