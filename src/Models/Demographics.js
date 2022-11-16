export default class Demographics {
  // These are used to store pre-computed values of the property; basically, a minor efficiency item
  #total;
  #white;
  #whitePer;
  #black;
  #blackPer;
  #hispanic;
  #hispanicPer;
  #asian;
  #asianPer;
  #other;
  #otherPer;
  #unknown;
  #unknownPer;

  // Dumb assignment constructor, but it works for this very simple app
  constructor(template) {
    if (template) Object.assign(this, template);
  }

  // total
  get total() {
    if (this.#total) return this.#total;
    const value = this?.REG20;
    this.#total = value;
    return value;
  }

  // registered by group
  get white() {
    if (this.#white) return this.#white;
    const value = (this?.WMREG20 || 0) + (this?.WFMREG20 || 0) + (this?.WUKNREG20 || 0);
    this.#white = value;
    return value;
  }

  get whitePer() {
    if (this.#whitePer) return this.#whitePer;
    const value = this.white / this.total;
    this.#whitePer = value;
    return value;
  }

  get black() {
    if (this.#black) return this.#black;
    const value = (this?.BLMREG20 || 0) + (this?.BLFREG20 || 0) + (this?.BLUKNREG20 || 0);
    this.#black = value;
    return value;
  }

  get blackPer() {
    if (this.#blackPer) return this.#blackPer;
    const value = this.black / this.total;
    this.#blackPer = value;
    return value;
  }

  get asian() {
    if (this.#asian) return this.#asian;
    const value = (this?.ASIANMREG2 || 0) + (this?.ASIANFMREG || 0) + (this?.ASIANUKNRE || 0);
    this.#asian = value;
    return value;
  }

  get asianPer() {
    if (this.#asianPer) return this.#asianPer;
    const value = this.asian / this.total;
    this.#asianPer = value;
    return value;
  }

  get hispanic() {
    if (this.#hispanic) return this.#hispanic;
    const value = (this?.HISPMREG20 || 0) + (this?.HISPFMREG2 || 0) + (this?.HSPUKNREG2 || 0);
    this.#hispanic = value;
    return value;
  }

  get hispanicPer() {
    if (this.#hispanicPer) return this.#hispanicPer;
    const value = this.hispanic / this.total;
    this.#hispanicPer = value;
    return value;
  }

  get other() {
    if (this.#other) return this.#other;
    const value = (this?.OTHERMREG2 || 0) + (this?.OTHERFMREG || 0) + (this?.OTHERUKNRE || 0);
    this.#other = value;
    return value;
  }

  get otherPer() {
    if (this.#otherPer) return this.#otherPer;
    const value = this.other / this.total;
    this.#otherPer = value;
    return value;
  }

  get unknown() {
    if (this.#unknown) return this.#unknown;
    const value = (this?.UKNMALEREG || 0) + (this?.UKNFMREG20 || 0) + (this?.UKNOWNREG2 || 0);
    this.#unknown = value;
    return value;
  }

  get unknownPer() {
    if (this.#unknownPer) return this.#unknownPer;
    const value = this.unknown / this.total;
    this.#unknownPer = value;
    return value;
  }
}
