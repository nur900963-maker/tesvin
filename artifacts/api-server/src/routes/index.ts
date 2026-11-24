import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import toolsRouter from "./tools";
import animeRouter from "./anime";
import logsRouter from "./logs";
import statsRouter from "./stats";
import siputzxRouter from "./siputzx";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(toolsRouter);
router.use(animeRouter);
router.use(logsRouter);
router.use(statsRouter);
router.use(siputzxRouter);
router.use(seedRouter);

export default router;
