// wx.js
import crypto from "crypto";
import { parseString } from "xml2js";

const TOKEN = "weixin";

// 小宇搜索 API 请求
async function searchMovie(keyword) {
  try {
    const resp = await fetch(`https://xykmovie.com/search?key=${encodeURIComponent(keyword)}`);
    const text = await resp.text();

    // 提取 <a class="copy" data-code="..."> 的属性
    const matches = [...text.matchAll(/<a[^>]+class="copy"[^>]+data-code="([^"]+)"/g)];
    return matches.length > 0
      ? matches.slice(0, 5).map(m => m[1]).join("\n")
      : "未找到结果";
  } catch (e) {
    console.error("搜索失败：", e);
    return "搜索失败，请稍后再试。";
  }
}

export default async function handler(req, res) {
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
    req.on("end", async () => {
      console.log("收到微信消息：", body);

      parseString(body, { explicitArray: false }, async (err, result) => {
        if (err) {
          res.status(400).send("Invalid XML");
          return;
        }

        const msg = result.xml;
        const fromUser = msg.FromUserName;
        const toUser = msg.ToUserName;
        const keyword = msg.Content?.trim();

        // 如果有关键词，就去搜索
        let replyContent = "请输入关键词进行搜索。";
        if (keyword) {
          replyContent = await searchMovie(keyword);
        }

        const reply = `
          <xml>
            <ToUserName><![CDATA[${fromUser}]]></ToUserName>
            <FromUserName><![CDATA[${toUser}]]></FromUserName>
            <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[${replyContent}]]></Content>
          </xml>
        `;

        res.setHeader("Content-Type", "application/xml");
        res.status(200).send(reply);
      });
    });
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
