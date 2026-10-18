/**
 * Browser-friendly entry for the vendored Neroli's Lab `common/` package.
 * Prototypes (Float32Array helpers, logger) must load before game data.
 */
import '../vendor/nerolis-lab/common/src/prototype/Float32Array'
import '../vendor/nerolis-lab/common/src/prototype/Int16Array'
import '../vendor/nerolis-lab/common/src/prototype/logger'

export * from '../vendor/nerolis-lab/common/src/types'
export * from '../vendor/nerolis-lab/common/src/utils'
