import { Tag, TagToken, TopLevelToken, Liquid, Template, Context, Emitter } from 'liquidjs';
import { Parser } from 'liquidjs/dist/parser'; 

import { OptionVal, getNpmOption } from './util.js';

export class IfNpmOption extends Tag {
  varName: string;
  templates: Template[];
  endToken: string;
  test: (val: OptionVal) => boolean;

  constructor(tagToken: TagToken, remainTokens: TopLevelToken[], liquid: Liquid, parser: Parser) {
    super(tagToken, remainTokens, liquid);
    this.templates = [];
    switch (tagToken.name) {
      case 'unlessNpmOption':
        this.endToken = 'endunlessNpmOption';
        this.test = (val: OptionVal) => !val;
        break;
      case 'ifNpmOption':
        this.endToken = 'endifNpmOption';
        this.test = (val: OptionVal) => !!val;
        break;
      default:
        throw new Error(`unsupported tag ${tagToken.getText()}`);
    }
    parser.parseStream(remainTokens)
      .on('start', () => {
        this.varName = tagToken.tokenizer.readFilteredValue().getText();
      })
      .on('template', (tpl: Template) => {
        this.templates.push(tpl);
      })
      .on(`tag:${this.endToken}`, function (token: TagToken) {
        this.stop();
      })
      .on('end', () => {
        throw new Error(`tag ${tagToken.getText()} not closed`);
      })
      .start();
  }

  * render(context: Context, emitter: Emitter) {
    const pkgName = context.environments['package'].name as string;
    const val = getNpmOption(pkgName,
      context.environments['env'], this.varName);
    yield this.liquid.renderer.renderTemplates(
      this.test(val) ? this.templates : [],
      context, emitter);
  }
}
