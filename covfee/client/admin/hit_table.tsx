import * as React from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { CopyOutlined, EditOutlined } from '@ant-design/icons'

import { HitType } from 'types/hit'
import { HitInstanceGraph } from './hit_graph'
import { getHitInstance } from '../models/Hit'
import { Container } from './hit_block'

interface Props { 
    hits: Array<HitType>
    onEditHit: (arg0: number) => void
}
export const HITTable = (props: Props) => {

    const getExpandableContent = (record: any) => {

        
        return props.hits[record.index].instances.map(async (instance, index) => {
            const hit = await getHitInstance(instance.id)
            return <Container instance={instance} key={index}></Container>
        })
        
    }

    const data = props.hits.map((hit, index)=>{
        return {
            index: index,
            key: hit.id,
            id: hit.id,
            name: hit.name,
            instances: hit.instances.length,
            generatorUrl: hit.generator_url
        }
    })

    const columns: ColumnsType<any> = [
        {
            title: 'HIT',
            dataIndex: 'name',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.toString().localeCompare(b.toString()),
        },
        {
            title: 'Instances',
            dataIndex: 'instances',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a - b
        },
        {
            title: 'Submitted',
            dataIndex: 'submitted',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.toString().localeCompare(b.toString()),
        },
        {
            title: 'Links',
            dataIndex: 'generatorUrl',
            render: url => <><CopyToClipboard text={url}><CopyOutlined/></CopyToClipboard></>
        },
        {
            title: 'Edit',
            dataIndex: 'index',
            render: index => <EditOutlined onClick={()=>{props.onEditHit(index)}}/>
        }
    ]

    return <Table dataSource={data} columns={columns} size="small" pagination={false} expandable={{
        expandedRowRender: record => getExpandableContent(record),
        rowExpandable: record => true,
    }}/>
}