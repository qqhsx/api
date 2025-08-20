import crypto from "crypto";

// 你在微信公众平台配置的 Token
const TOKEN = "weixin";

export default function handler(req, res) {
  if (req.method === "GET") {
    // 微信服务器验证
    const { signature, timestamp, nonce, echostr } = req.query;

    const tmpArr = [TOKEN, timestamp, nonce].sort();
    const tmpStr = tmpArr.join("");
    const hash = crypto.createHash("sha1").update(tmpStr).digest("hex");

    if (hash === signature) {
      res.status(200).send(echostr);
    } else {
      res.status(403).send("Invalid signature");
    }
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      console.log("收到微信消息：", body);

      // 此处简单返回一条文本消息（需替换为真实的 FromUserName/ToUserName）
      const reply = `
        <xml>
          <ToUserName><![CDATA[oOpenID]]></ToUserName>
          <FromUserName><![CDATA[gh_xxxxx]]></FromUserName>
          <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[你好！这是 Vercel 自动回复。]]></Content>
        </xml>
      `;

      res.setHeader("Content-Type", "application/xml");
      res.status(200).send(reply);
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
