import crypto from "crypto";

const TOKEN = "weixin"; // 和微信公众平台配置一致

export default async function handler(req, res) {
  if (req.method === "GET") {
    // --- 验证服务器配置 ---
    const { signature, timestamp, nonce, echostr } = req.query;

    const tmpArr = [TOKEN, timestamp, nonce].sort();
    const tmpStr = tmpArr.join("");
    const hash = crypto.createHash("sha1").update(tmpStr).digest("hex");

    if (hash === signature) {
      res.status(200).send(echostr); // 验证成功
    } else {
      res.status(403).send("Invalid signature");
    }
  } else if (req.method === "POST") {
    // --- 微信消息 ---
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      console.log("📩 收到微信消息:", body);

      // 简单匹配 FromUserName / ToUserName（避免用外部库）
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
          <Content><![CDATA[你好 👋！这是 Vercel 自动回复。]]></Content>
        </xml>
      `;

      res.setHeader("Content-Type", "application/xml");
      res.status(200).send(reply);
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
