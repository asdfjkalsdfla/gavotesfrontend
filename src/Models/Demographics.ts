import type { DemographicsData } from "./types";

export default class Demographics {
  // Public properties from the template
  REG20?: number;
  WMREG20?: number;
  WFMREG20?: number;
  WUKNREG20?: number;
  BLMREG20?: number;
  BLFREG20?: number;
  BLUKNREG20?: number;
  ASIANMREG2?: number;
  ASIANFMREG?: number;
  ASIANUKNRE?: number;
  HISPMREG20?: number;
  HISPFMREG2?: number;
  HSPUKNREG2?: number;
  OTHERMREG2?: number;
  OTHERFMREG?: number;
  OTHERUKNRE?: number;
  UKNMALEREG?: number;
  UKNFMREG20?: number;
  UKNOWNREG2?: number;

  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #total?: number;
  #white?: number;
  #whitePer?: number;
  #black?: number;
  #blackPer?: number;
  #hispanic?: number;
  #hispanicPer?: number;
  #asian?: number;
  #asianPer?: number;
  #other?: number;
  #otherPer?: number;
  #unknown?: number;
  #unknownPer?: number;

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template?: DemographicsData) {
    if (template) Object.assign(this, template);
  }

  // total
  get total(): number | undefined {
    if (this.#total !== undefined) return this.#total;
    const value = this?.REG20;
    this.#total = value;
    return value;
  }

  // registered by group
  get white(): number {
    if (this.#white !== undefined) return this.#white;
    const value = (this?.WMREG20 || 0) + (this?.WFMREG20 || 0) + (this?.WUKNREG20 || 0);
    this.#white = value;
    return value;
  }

  get whitePer(): number | undefined {
    if (this.#whitePer !== undefined) return this.#whitePer;
    const total = this.total;
    const value = total ? this.white / total : undefined;
    this.#whitePer = value;
    return value;
  }

  get black(): number {
    if (this.#black !== undefined) return this.#black;
    const value = (this?.BLMREG20 || 0) + (this?.BLFREG20 || 0) + (this?.BLUKNREG20 || 0);
    this.#black = value;
    return value;
  }

  get blackPer(): number | undefined {
    if (this.#blackPer !== undefined) return this.#blackPer;
    const total = this.total;
    const value = total ? this.black / total : undefined;
    this.#blackPer = value;
    return value;
  }

  get asian(): number {
    if (this.#asian !== undefined) return this.#asian;
    const value = (this?.ASIANMREG2 || 0) + (this?.ASIANFMREG || 0) + (this?.ASIANUKNRE || 0);
    this.#asian = value;
    return value;
  }

  get asianPer(): number | undefined {
    if (this.#asianPer !== undefined) return this.#asianPer;
    const total = this.total;
    const value = total ? this.asian / total : undefined;
    this.#asianPer = value;
    return value;
  }

  get hispanic(): number {
    if (this.#hispanic !== undefined) return this.#hispanic;
    const value = (this?.HISPMREG20 || 0) + (this?.HISPFMREG2 || 0) + (this?.HSPUKNREG2 || 0);
    this.#hispanic = value;
    return value;
  }

  get hispanicPer(): number | undefined {
    if (this.#hispanicPer !== undefined) return this.#hispanicPer;
    const total = this.total;
    const value = total ? this.hispanic / total : undefined;
    this.#hispanicPer = value;
    return value;
  }

  get other(): number {
    if (this.#other !== undefined) return this.#other;
    const value = (this?.OTHERMREG2 || 0) + (this?.OTHERFMREG || 0) + (this?.OTHERUKNRE || 0);
    this.#other = value;
    return value;
  }

  get otherPer(): number | undefined {
    if (this.#otherPer !== undefined) return this.#otherPer;
    const total = this.total;
    const value = total ? this.other / total : undefined;
    this.#otherPer = value;
    return value;
  }

  get unknown(): number {
    if (this.#unknown !== undefined) return this.#unknown;
    const value = (this?.UKNMALEREG || 0) + (this?.UKNFMREG20 || 0) + (this?.UKNOWNREG2 || 0);
    this.#unknown = value;
    return value;
  }

  get unknownPer(): number | undefined {
    if (this.#unknownPer !== undefined) return this.#unknownPer;
    const total = this.total;
    const value = total ? this.unknown / total : undefined;
    this.#unknownPer = value;
    return value;
  }
}
