// @ts-ignore
import { Request, Response } from "express";

export default {
  "POST /billing/admin/export": (req: Request, res: Response) => {
    res.status(200).send({ file: "8HSN" });
  },
  "POST /billing/admin/get": (req: Request, res: Response) => {
    res.status(200).send({ records: ["&wnZn%", "Od43i", "0#s33i"] });
  },
};
