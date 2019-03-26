import _ from 'lodash'
import { parse as parseCQTags, CQAt } from 'cq-websocket'

export default class BaseSkill {
  static Name    = ''
  static Aliases = []
  static RequiredLevel = 9  // 0~5
  static Options = [
    // { name: 'target', type: CQAt },
    // { name: 'duration', type: Number, default: 60 },
  ]

  constructor(args, ctx) {
    this.group_id  = ctx.group_id
    this.caster_id = ctx.user_id
    this._parseOptions(args)
  }

  create = async () => {
    this.active = true
  }

  destory = async () => {
    this.active = false
  }

  _parseOptions(args) {
    for (const [Opt, arg] of _.zip(this.constructor.Options, args)) {
      if (Opt == null)
        break
      if (arg == null) {
        if (Opt.default != null)
          this[Opt.name] = Opt.default
        else
          throw new TypeError(`Parameter '${Opt.name}' is required.`)
      }
      if (arg != null) {
        if (Opt.type === Number) {
          const val = parseInt(arg != null ? arg : Opt.default)
          if (! isNaN(val))
            this[Opt.name] = val
          else
            throw new TypeError(`Parameter '${Opt.name}' must be ${Opt.type.name}.`)
        }
        if (Opt.type === CQAt) {
          const tags = parseCQTags(arg)
          if (tags.length === 1 && tags[0] instanceof Opt.type )
            this[Opt.name] = tags[0]
          else
            throw new TypeError(`Parameter '${Opt.name}' must be ${Opt.type.name}.`)
        }
      }
    }
  }
}
