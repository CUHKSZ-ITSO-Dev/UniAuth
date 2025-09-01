// @ts-ignore
import { Request, Response } from "express";

export default {
  "POST /api/v1/admin/toggle-permission": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "POST /api/v1/auth/check": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "GET /api/v1/admin/stats": (req: Request, res: Response) => {
    res.status(200).send({
      totalUsers: 1250,
      activeUsers: 856,
      totalPermissions: 2340,
      abstractGroups: 45,
      groupDistribution: {
        "管理员组": 15,
        "开发者组": 89,
        "测试组": 67,
        "普通用户组": 125
      },
      recentActivity: [
        { timestamp: "2024-01-01T00:00:00Z", count: 12 },
        { timestamp: "2024-01-02T00:00:00Z", count: 18 },
        { timestamp: "2024-01-03T00:00:00Z", count: 15 },
        { timestamp: "2024-01-04T00:00:00Z", count: 22 },
        { timestamp: "2024-01-05T00:00:00Z", count: 19 },
        { timestamp: "2024-01-06T00:00:00Z", count: 25 },
        { timestamp: "2024-01-07T00:00:00Z", count: 28 }
      ],
      dailyLogins: [],
      permissionUsage: [],
    });
  },
};
