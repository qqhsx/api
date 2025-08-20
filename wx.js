export default function handler(req, res) {
  if (req.method === "GET") {
    // 微信接入验证
    const { signature, timestamp, nonce, echostr } = req.query;
    // TODO: 验证 signature 是否正确（使用你公众号配置里的 Token）
    res.send(echostr);
  } else if (req.method === "POST") {
    // 处理用户消息
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      console.log("收到消息:", body);

      // 解析 XML 消息，这里简单直接返回一段文本
      const reply = `
      <xml>
        <ToUserName><![CDATA[${"OPENID"}]]></ToUserName>
        <FromUserName><![CDATA[${"YOUR_ID"}]]></FromUserName>
        <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[你发了消息: 测试]]></Content>
      </xml>
      `;

      res.setHeader("Content-Type", "application/xml");
      res.send(reply);
    });
  }
}
