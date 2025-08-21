import crypto from "crypto";
import { parseString } from "xml2js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// 你在微信公众平台配置的 Token
const TOKEN = "weixin";

// 小宇搜索函数
async function searchXyk(keyword) {
  const url = `https://xykmovie.com/s/1/${encodeURIComponent(keyword)}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    },
  });

  const html = await resp.text();
  const $ = cheerio.load(html);

  let results = [];
  $("a.copy").each((i, el) => {
    const text = $(el).attr("data-code");
    if (text) {
      results.push(`${i + 1}. ${text}`);
    }
  });

  if (results.length === 0) {
    return "没有找到相关资源～";
  }

  // 限制最多 8 条，防止微信消息太长
  return results.slice(0, 8).join("\n\n");
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
    req.on("data", (chunk) => {
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

        let replyContent = "请输入关键字进行搜索";
        if (keyword) {
          replyContent = await searchXyk(keyword);
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
