import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authConfigRouter from "./auth-config";
import meRouter from "./me";
import readersRouter from "./readers";
import sessionsRouter from "./sessions";
import rtcRouter from "./rtc";
import billingRouter from "./billing";
import messagesRouter from "./messages";
import forumRouter from "./forum";
import communityRouter from "./community";
import adminRouter from "./admin";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authConfigRouter);
router.use(meRouter);
router.use(readersRouter);
router.use(sessionsRouter);
router.use(rtcRouter);
router.use(billingRouter);
router.use(messagesRouter);
router.use(forumRouter);
router.use(communityRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;
