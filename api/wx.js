import crypto from "crypto";
import { parseStringPromise } from "xml2js";

const TOKEN = "weixin"; // 你在公众平台配置的 Token

export default async function handler(req, res) {
  if (req.method === "GET") {
    // --- 服务器验证 ---
    const { signature, timestamp, nonce, echostr } = req.query;

    const tmpArr = [TOKEN, timestamp, nonce].sort();
    const tmpStr = tmpArr.join("");
    const hash = crypto.createHash("sha1").update(tmpStr).digest("hex");

    if (hash === signature) {
      res.status(200).send(echostr); // 验证通过
    } else {
      res.status(403).send("Invalid signature");
    }
  } else if (req.method === "POST") {
    // --- 收到微信用户的消息 ---
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        console.log("📩 原始消息：", body);

        const result = await parseStringPromise(body, { explicitArray: false });
        const msg = result.xml;
        console.log("✅ 解析后的消息：", msg);

        const toUser = msg.FromUserName;   // 用户的 OpenID
        const fromUser = msg.ToUserName;   // 公众号原始 ID

        // 固定回复文本
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
      } catch (err) {
        console.error("❌ 解析出错：", err);
        res.status(200).send("success"); // 避免微信重试
      }
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
