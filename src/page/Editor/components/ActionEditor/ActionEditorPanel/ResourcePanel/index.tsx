import { forwardRef, useState, useImperativeHandle, useContext } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Api } from "@/api/base"
import { Divider } from "@illa-design/divider"
import { ParamValues } from "@/page/Editor/components/ActionEditor/Resource"
import { ActionItemConfig } from "@/redux/currentApp/action/actionList/actionListState"
import { selectAllResource } from "@/redux/currentApp/action/resource/resourceSelector"
import { selectAllActionItem } from "@/redux/currentApp/action/actionList/actionListSelector"
import { actionListActions } from "@/redux/currentApp/action/actionList/actionListSlice"
import { Transformer } from "@/page/Editor/components/ActionEditor/ActionEditorPanel/Transformer"
import { ActionEditorContext } from "@/page/Editor/components/ActionEditor/context"
import { ResourceParams } from "@/page/Editor/components/ActionEditor/ActionEditorPanel/ResourceParams"
import { EventHandler } from "@/page/Editor/components/ActionEditor/ActionEditorPanel/EventHandler"
import { triggerRunRef } from "@/page/Editor/components/ActionEditor/ActionEditorPanel/interface"
import { ResourcePanelProps } from "./interface"

const dataTransform = (data: any) => {
  const _data = {
    resourceId: "04813000-438f-468e-a8c1-d34518b6c2fa",
    type: "SQLQuery",
    name: "sqlEg",
    actionTemplate: {
      mode: "sql",
      query: "select * from users limit 100",
      enableTransformer: false,
      transformer:
        "// The variable 'data' allows you to reference the request's data in the transformer. \n// example: return data.find(element => element.isError)\nreturn data.error",
      events: [],
    },
  }
  _data.actionTemplate.query = data.general?.query
  return _data
}

export const ResourcePanel = forwardRef<triggerRunRef, ResourcePanelProps>(
  (props, ref) => {
    const { resourceId, onChange, onSave } = props
    const { activeActionItemId } = useContext(ActionEditorContext)
    let resourceType: string
    let resource
    const activeActionItem = useSelector(selectAllActionItem).find(
      ({ id }) => id === activeActionItemId,
    )
    const allResource = useSelector(selectAllResource)
    const dispatch = useDispatch()

    const [params, setParams] = useState<
      Pick<ActionItemConfig, "general" | "transformer" | "eventHandler">
    >({
      general: {},
      transformer: {
        value: "",
        enable: false,
      },
      eventHandler: {},
    })

    resource = useSelector(selectAllResource).find(
      (i) => i.resourceId === resourceId,
    )

    const onParamsChange = (value: ParamValues) => {
      setParams({ ...params, general: value })
      onChange && onChange()
    }

    const run = () => {
      const _data = dataTransform(params)
      Api.request({
        url: "/api/v1/actions/:id/run",
        method: "POST",
        data: _data,
      })
    }

    const saveAndRun = () => {
      run()

      dispatch(
        actionListActions.updateActionItemReducer({
          ...activeActionItem,
          resourceId,
          config: {
            ...activeActionItem?.config,
            ...params,
          },
        }),
      )

      onSave && onSave()
    }

    useImperativeHandle(ref, () => {
      return { run, saveAndRun }
    })

    if (resourceId?.indexOf("preset") !== -1) {
      resourceType = resourceId?.split("_")[1] ?? ""
    } else {
      resource = allResource.find((i) => i.resourceId === resourceId)
      resourceType = resource?.resourceType ?? ""
    }

    return (
      <>
        <ResourceParams resourceType={resourceType} onChange={onParamsChange} />
        <Transformer />
        <Divider />
        <EventHandler />
      </>
    )
  },
)

ResourcePanel.displayName = "ResourcePanel"