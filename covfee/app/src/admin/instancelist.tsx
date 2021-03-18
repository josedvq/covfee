import { LoadingOutlined, RightOutlined } from '@ant-design/icons'
import { Table } from 'antd'
import download from 'downloadjs'
import * as React from 'react'
import { fetcher, myerror, myinfo, throwBadResponse } from '../utils'
const Constants = require('Constants')

export class InstanceListAsync extends React.Component {
    state = {
        loading: true
    }
    url: string

    constructor(props) {
        super(props)
        this.hitId = props.hitId
        this.url = Constants.api_url + '/hits/' + this.hitId
    }
    
    componentDidMount() {
        // fetch projects
        const url = this.url + '?' + new URLSearchParams({
            with_instances: '1',
            with_tasks: '1',
            with_instance_tasks: '1'
        })

        fetcher(url)
            .then(throwBadResponse)
            .then((hit) => {
                this.props.setInstances(this.props.hitKey, hit.instances)
                this.setState({loading: false})
            })
            .catch(error => {
                myerror('Error loading instances.', error)
            })
    }

    render() {
        if(this.state.loading)
            return <div style={{textAlign: 'center'}}><LoadingOutlined /></div>
        else
            return <InstanceList instances={this.props.instances} />
    }
}

export class InstanceList extends React.Component {

    getDownloadHandler = (url: string, csv: boolean) => {
        const request_url = url + '/download' + (csv ? '?csv=1' : '')
        return () => {
            fetcher(request_url).then(async (response: any) => {
                if (!response.ok) {
                    const data = await response.json()
                    if (data.hasOwnProperty('msg')) {
                        throw Error(data.msg)
                    }
                    throw Error(response.statusText)
                }
                return response
            }).then(async (response: any) => {
                if (response.status == 204) {
                    return myinfo('Nothing to download.')
                }
                const blob = await response.blob()
                download(blob)
            }).catch(error => {
                myerror('Error fetching task response.', error)
            })
        }
    }

    render() {
        const data = this.props.instances.map((instance, index) => {
            return {
                key: instance.id,
                id: instance.id,
                tasks: Object.keys(instance.tasks).length,
                url: Constants.api_url + '/instances/' + instance.id
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'ID',
                dataIndex: 'id',
                render: id => <a href={Constants.app_url + '/hits/' + id} target="blank"><RightOutlined /> {id.substring(0, 16)}</a>
            },
            {
                title: 'Tasks',
                dataIndex: 'tasks',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a-b,
                render: tasks => 'tasks: '+tasks
            },
            {
                title: 'Data',
                dataIndex: 'url',
                render: url => <>
                    Download: <a onClick={this.getDownloadHandler(url, false)}>JSON</a>
                </>
            }
        ]

        return <Table 
            dataSource={data} 
            style={{marginLeft: '2em'}}
            columns={columns} 
            size="small" 
            pagination={false} 
            showHeader={false} 
            indentSize={15}/>
    }
}