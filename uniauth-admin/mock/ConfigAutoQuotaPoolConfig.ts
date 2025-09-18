// @ts-ignore
import { Request, Response } from "express";

export default {
  "DELETE /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "GET /config/autoConfig": (req: Request, res: Response) => {
    // 模拟自动配额池规则列表数据
    const mockData = {
      items: [
        {
          id: 1,
          ruleName: "每日配额规则",
          description: "为所有用户每日分配基础配额",
          cronCycle: "0 0 3 * * *",
          regularQuota: "100",
          enabled: true,
          filterGroup: {},
          priority: 10,
          lastEvaluatedAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 2,
          ruleName: "VIP用户配额规则",
          description: "为VIP用户分配额外配额",
          cronCycle: "0 0 2 * * *",
          regularQuota: "500",
          enabled: true,
          filterGroup: {},
          priority: 5,
          lastEvaluatedAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 3,
          ruleName: "新用户配额规则",
          description: "为新注册用户分配初始配额",
          cronCycle: "0 0 4 * * *",
          regularQuota: "200",
          enabled: false,
          filterGroup: {},
          priority: 15,
          lastEvaluatedAt: null,
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ],
    };
    res.status(200).send(mockData);
  },
  "POST /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "PUT /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "POST /autoQuotaPool/autoQuotaPool/test": (req: Request, res: Response) => {
    // 模拟测试规则接口
    const { ruleName, dryRun } = req.body;
    if (dryRun) {
      // 模拟dryRun结果
      res.status(200).send({
        success: true,
        data: {
          ruleName,
          expectedMatchedUsers: Math.floor(Math.random() * 1000) + 100, // 随机生成预计匹配用户数
          testTime: new Date().toISOString(),
        }
      });
    } else {
      // 模拟实际执行结果
      res.status(200).send({
        success: true,
        message: `规则 "${ruleName}" 执行成功`
      });
    }
  },
  "POST /autoQuotaPool/autoQuotaPool/reevaluate": (req: Request, res: Response) => {
    // 模拟重新评估规则接口
    res.status(200).send({
      success: true,
      message: "所有规则重新评估完成"
    });
  }
};
