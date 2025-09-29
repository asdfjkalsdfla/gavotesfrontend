import type AbsenteeBallots from "./AbsenteeBallots";
import type AbsenteeBallotsComparison from "./AbsenteeBallotsComparison";
import type Demographics from "./Demographics";
import type ElectionResult from "./ElectionResult";
import type ElectionResultComparison from "./ElectionResultComparison";
// Combined election data row interface - used for processed election data in the hook
interface CombinedElectionRow {
	id: string;
	CTYNAME: string;
	PRECINCT_N?: string;
	absenteeCurrent?: AbsenteeBallots;
	absenteeBase?: AbsenteeBallots;
	electionResultsAllCurrent?: ElectionResult[];
	electionResultsCurrent?: ElectionResult;
	electionResultsAllBase?: ElectionResult[];
	electionResultsBase?: ElectionResult;
	electionResultsComparison?: ElectionResultComparison;
	absenteeBallotComparison?: AbsenteeBallotsComparison | null;
	demographics?: Demographics;
}

export default CombinedElectionRow;
