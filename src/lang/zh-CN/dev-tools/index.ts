import gen from './gen'
import editTable from './edit-table'
import basicInfoForm from './basic-info-form'
import genInfoForm from './gen-info-form'

/**
 * The dev-tools section, one module per page under src/views/dev-tools.
 *
 * The file names match the components they belong to -- gen.ts for gen/index.vue
 * (`defineOptions({ name: 'Gen' })`), edit-table.ts for editTable.vue -- so the
 * keys read as `devTools.editTable.tabBasic`. The generator's editor is three
 * files rather than one because its two tabs are separate components with
 * separate rule sets; keeping their text together would make the biggest
 * language file in the repository out of the least-visited page.
 *
 * swagger/index.vue is absent and needs nothing: it is an iframe around the
 * backend's own Swagger UI and contains no Chinese at all.
 *
 * build/index.vue is absent for the opposite reason -- it is not migrated yet,
 * and a half-migrated page is worse than an unmigrated one.
 */
export default { gen, editTable, basicInfoForm, genInfoForm }
