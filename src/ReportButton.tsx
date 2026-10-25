import { useAction, type Context } from "./ui";
import type { PayloadOf } from "./business";
import { projectReportBlocks, reportTabs } from "./projectReport";
import { download } from "./transfer";

export function ReportButton({
  ctx,
  tab,
  survey,
  disabled = false,
}: {
  ctx: Context;
  tab: number;
  survey?: PayloadOf<"survey">;
  disabled?: boolean;
}) {
  const action = useAction();
  return (
    <div>
      <button
        type="button"
        className="secondary"
        disabled={disabled || action.busy}
        onClick={() =>
          void action.act(async () => {
            const project = ctx.data.projects.find(
              (p) => p.id === ctx.projectId,
            );
            if (!project) throw new Error("A projekt nem található.");
            const { makeReportPdf } = await import("./reportPdf");
            const bytes = await makeReportPdf(
              projectReportBlocks(ctx.data, project, tab, survey),
              ctx.repo,
              ctx.data,
            );
            const title = survey?.name || project.title;
            download(
              bytes,
              `${title.replace(/[^\p{L}\p{N} ._-]/gu, "_").slice(0, 100)}-${reportTabs[tab]}.pdf`,
              "application/pdf",
            );
          })
        }
      >
        {action.busy ? "PDF készül…" : "PDF letöltése"}
      </button>
      {action.feedback}
    </div>
  );
}
