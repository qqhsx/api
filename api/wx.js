// api/wx.js
import crypto from "crypto";
import { parseStringPromise, Builder } from "xml2js";

const TOKEN = "weixin"; // 微信后台配置的 Token

export default async function handler(req, res) {
  if (req.method === "GET") {
    // ----------------------
    // 微信服务器验证
    // ----------------------
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
    // ----------------------
    // 接收用户消息并自动回复
    // ----------------------
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        // 解析 XML
        const result = await parseStringPromise(body, { explicitArray: false });
        const msg = result.xml;

        console.log("收到消息：", msg);

        const toUser = msg.FromUserName;   // 用户的 OpenID
        const fromUser = msg.ToUserName;   // 公众号原始ID

        // 构造回复消息
        const builder = new Builder({ rootName: "xml", headless: true, cdata: true });
        const replyMsg = {
          ToUserName: toUser,
          FromUserName: fromUser,
          CreateTime: Math.floor(Date.now() / 1000),
          MsgType: "text",
          Content: "你好 👋！这是 Vercel 自动回复。",
        };

        const replyXml = builder.buildObject(replyMsg);

        res.setHeader("Content-Type", "application/xml");
        res.status(200).send(replyXml);
      } catch (e) {
        console.error("消息解析失败:", e);
        res.status(500).send("Internal Server Error");
      }
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
