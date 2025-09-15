interface DemographicsTemplate {
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
}

export default class Demographics {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #total: number | undefined;
  #white: number | undefined;
  #whitePer: number | undefined;
  #black: number | undefined;
  #blackPer: number | undefined;
  #hispanic: number | undefined;
  #hispanicPer: number | undefined;
  #asian: number | undefined;
  #asianPer: number | undefined;
  #other: number | undefined;
  #otherPer: number | undefined;
  #unknown: number | undefined;
  #unknownPer: number | undefined;

  // Demographics data fields
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

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template?: DemographicsTemplate) {
    if (template) Object.assign(this, template);
  }

  // total
  get total(): number | undefined {
    if (this.#total) return this.#total;
    const value = this?.REG20;
    this.#total = value;
    return value;
  }

  // registered by group
  get white(): number {
    if (this.#white) return this.#white;
    const value = (this?.WMREG20 || 0) + (this?.WFMREG20 || 0) + (this?.WUKNREG20 || 0);
    this.#white = value;
    return value;
  }

  get whitePer(): number {
    if (this.#whitePer) return this.#whitePer;
    const value = this.total ? this.white / this.total : 0;
    this.#whitePer = value;
    return value;
  }

  get black(): number {
    if (this.#black) return this.#black;
    const value = (this?.BLMREG20 || 0) + (this?.BLFREG20 || 0) + (this?.BLUKNREG20 || 0);
    this.#black = value;
    return value;
  }

  get blackPer(): number {
    if (this.#blackPer) return this.#blackPer;
    const value = this.total ? this.black / this.total : 0;
    this.#blackPer = value;
    return value;
  }

  get asian(): number {
    if (this.#asian) return this.#asian;
    const value = (this?.ASIANMREG2 || 0) + (this?.ASIANFMREG || 0) + (this?.ASIANUKNRE || 0);
    this.#asian = value;
    return value;
  }

  get asianPer(): number {
    if (this.#asianPer) return this.#asianPer;
    const value = this.total ? this.asian / this.total : 0;
    this.#asianPer = value;
    return value;
  }

  get hispanic(): number {
    if (this.#hispanic) return this.#hispanic;
    const value = (this?.HISPMREG20 || 0) + (this?.HISPFMREG2 || 0) + (this?.HSPUKNREG2 || 0);
    this.#hispanic = value;
    return value;
  }

  get hispanicPer(): number {
    if (this.#hispanicPer) return this.#hispanicPer;
    const value = this.total ? this.hispanic / this.total : 0;
    this.#hispanicPer = value;
    return value;
  }

  get other(): number {
    if (this.#other) return this.#other;
    const value = (this?.OTHERMREG2 || 0) + (this?.OTHERFMREG || 0) + (this?.OTHERUKNRE || 0);
    this.#other = value;
    return value;
  }

  get otherPer(): number {
    if (this.#otherPer) return this.#otherPer;
    const value = this.total ? this.other / this.total : 0;
    this.#otherPer = value;
    return value;
  }

  get unknown(): number {
    if (this.#unknown) return this.#unknown;
    const value = (this?.UKNMALEREG || 0) + (this?.UKNFMREG20 || 0) + (this?.UKNOWNREG2 || 0);
    this.#unknown = value;
    return value;
  }

  get unknownPer(): number {
    if (this.#unknownPer) return this.#unknownPer;
    const value = this.total ? this.unknown / this.total : 0;
    this.#unknownPer = value;
    return value;
  }
}
