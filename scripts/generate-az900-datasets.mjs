import { writeFileSync } from 'node:fs';

const STUDY_GUIDE = 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900';

const objectives = {
  'cloud-computing': {
    domainId: 'cloud-concepts',
    note: 'Cloud models, consumption pricing, serverless operation, and the shared responsibility model determine who manages each layer and how the service is consumed.',
    reference: ['Describe cloud computing', 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/']
  },
  'cloud-benefits': {
    domainId: 'cloud-concepts',
    note: 'Cloud benefits distinguish availability, scalability, elasticity, reliability, predictability, governance, security, and manageability.',
    reference: ['Describe the benefits of using cloud services', 'https://learn.microsoft.com/en-us/training/modules/describe-benefits-use-cloud-services/']
  },
  'service-types': {
    domainId: 'cloud-concepts',
    note: 'IaaS provides the most customer control, PaaS manages the application platform, and SaaS delivers a complete provider-managed application.',
    reference: ['Describe cloud service types', 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/']
  },
  'azure-architecture': {
    domainId: 'architecture-services',
    note: 'Azure regions and availability zones describe physical resiliency, while management groups, subscriptions, resource groups, and resources form the governance hierarchy.',
    reference: ['Describe core Azure architectural components', 'https://learn.microsoft.com/en-us/training/modules/describe-core-architectural-components-of-azure/']
  },
  'compute-networking': {
    domainId: 'architecture-services',
    note: 'The correct Azure compute or networking service follows from the required management model, connectivity, scaling, and exposure of the workload.',
    reference: ['Describe Azure compute and networking services', 'https://learn.microsoft.com/en-us/training/modules/describe-azure-compute-networking-services/']
  },
  'azure-storage': {
    domainId: 'architecture-services',
    note: 'Azure storage choices depend on the data shape, access pattern, durability requirement, access tier, and transfer method.',
    reference: ['Describe Azure storage services', 'https://learn.microsoft.com/en-us/training/modules/describe-azure-storage-services/']
  },
  'identity-security': {
    domainId: 'architecture-services',
    note: 'Microsoft Entra capabilities establish identity and access, Azure RBAC controls resource authorization, and layered security services reduce risk.',
    reference: ['Describe Azure identity, access, and security', 'https://learn.microsoft.com/en-us/training/modules/describe-azure-identity-access-security/']
  },
  'cost-management': {
    domainId: 'management-governance',
    note: 'Azure pricing and Cost Management tools estimate, allocate, monitor, and optimize spending; tags add useful business metadata but do not enforce access.',
    reference: ['Describe cost management in Azure', 'https://learn.microsoft.com/en-us/training/modules/describe-cost-management-azure/']
  },
  'governance-compliance': {
    domainId: 'management-governance',
    note: 'Azure Policy evaluates resource compliance, locks prevent accidental changes, and Microsoft Purview supports data governance and discovery.',
    reference: ['Describe Azure governance and compliance tools', 'https://learn.microsoft.com/en-us/training/modules/describe-features-tools-azure-for-governance-compliance/']
  },
  'management-deployment': {
    domainId: 'management-governance',
    note: 'Azure management tools provide portal, shell, hybrid, and infrastructure-as-code approaches through a consistent Resource Manager control plane.',
    reference: ['Describe tools for managing and deploying Azure resources', 'https://learn.microsoft.com/en-us/training/modules/describe-features-tools-manage-deploy-azure-resources/']
  },
  monitoring: {
    domainId: 'management-governance',
    note: 'Advisor recommends improvements, Service Health reports Azure service impact, and Azure Monitor collects and acts on platform and application telemetry.',
    reference: ['Describe monitoring tools in Azure', 'https://learn.microsoft.com/en-us/training/modules/describe-monitoring-tools-azure/']
  }
};

const banks = {
  'cloud-computing': [
    q('A company buys physical servers before deploying a new application. Which type of expenditure does this purchase represent?', 'Capital expenditure (CapEx)', ['Operational expenditure (OpEx)', 'Consumption-based billing', 'Serverless billing']),
    q('A development team uses a managed database service. Who remains responsible for classifying the data stored in the database?', 'The customer', ['Microsoft alone', 'The internet service provider', 'The database engine vendor alone']),
    q('An organization must keep certain workloads in its own datacenter while bursting other workloads into Azure. Which cloud model is this?', 'Hybrid cloud', ['Public cloud only', 'Private cloud only', 'Community cloud']),
    q('An Azure workload is billed according to the resources it consumes each month. Which cloud pricing characteristic does this demonstrate?', 'Consumption-based pricing', ['Fixed capital purchasing', 'Perpetual licensing only', 'Up-front datacenter depreciation']),
    m('Which TWO characteristics commonly apply to serverless computing?', ['The cloud provider manages the underlying infrastructure', 'Charges can be based on actual execution or consumption'], ['The customer must patch every host operating system', 'A dedicated physical server must be purchased first']),

    q('An online retailer automatically adds compute instances during a sale and removes them afterward. Which cloud characteristic is demonstrated?', 'Elasticity', ['Capital expenditure', 'Data sovereignty', 'Single tenancy']),
    q('Which statement best defines cloud computing?', 'Delivery of computing services over the internet', ['Purchase of software only on physical media', 'Operation of all servers by end users', 'A network that can contain only virtual machines']),
    q('A company retains a private cloud for regulated systems and uses Azure for customer-facing services. Which cloud model does the full environment represent?', 'Hybrid cloud', ['Public cloud', 'Private cloud', 'Software as a service']),
    q('In a SaaS solution, which responsibility normally remains with the customer?', 'Managing its data and user access', ['Replacing failed datacenter disks', 'Patching the application servers', 'Maintaining the hypervisor']),
    m('Which TWO statements describe a consumption-based cloud model?', ['Costs can vary with resource usage', 'Resources can be released when no longer required'], ['All capacity must be purchased years in advance', 'Unused physical servers remain a customer capital asset']),

    q('A bank operates a cloud environment dedicated to that organization in its own facilities. Which deployment model is this?', 'Private cloud', ['Public cloud', 'Hybrid cloud', 'Serverless computing']),
    q('Who owns and operates the physical infrastructure in the Microsoft Azure public cloud?', 'Microsoft', ['Every Azure subscriber jointly', 'The local internet provider', 'The application end users']),
    q('A team stops an unused pay-as-you-go resource to avoid further compute charges. Which cloud concept makes this possible?', 'Consumption-based pricing', ['Capital depreciation', 'Perpetual support', 'Private cloud ownership']),
    q('A function runs only when a message arrives and the team does not manage its host servers. Which computing model is being used?', 'Serverless computing', ['Dedicated hosting', 'Private networking', 'Desktop virtualization']),
    m('A company runs an application on Azure virtual machines. Which TWO tasks are normally the customer’s responsibility?', ['Patching the guest operating system', 'Configuring access to the application'], ['Replacing failed physical disks in the Azure datacenter', 'Maintaining the Azure hypervisor'])
  ],
  'cloud-benefits': [
    q('A service must remain accessible when one application instance fails. Which cloud benefit is the primary requirement?', 'High availability', ['Elasticity', 'Data classification', 'Capital expenditure']),
    q('A workload needs to add resources as demand grows but does not need to remove them automatically. Which benefit is required?', 'Scalability', ['Sovereignty', 'Shared responsibility', 'Serverless billing']),
    q('A company deploys copies of an application across fault-isolated locations. Which cloud benefit is this primarily intended to improve?', 'Reliability', ['Licensing predictability', 'Data tagging', 'Passwordless authentication']),
    q('Standard templates are used so every environment is deployed consistently. Which cloud benefit does this support?', 'Manageability', ['Capital expenditure', 'Physical isolation', 'Data residency']),

    q('A web service increases and decreases capacity automatically as requests change. Which cloud benefit is demonstrated?', 'Elasticity', ['Governance', 'Data sovereignty', 'Manual manageability']),
    q('A business wants consistent estimates of performance and cost before deployment. Which cloud benefit is most relevant?', 'Predictability', ['Private ownership', 'Single tenancy', 'Data classification']),
    q('Central policies enforce allowed regions across hundreds of subscriptions. Which cloud benefit is demonstrated?', 'Governance', ['Capital expenditure', 'Physical maintenance', 'Server ownership']),
    q('Administrators manage resources from a web portal, command line, or API. Which cloud benefit does this illustrate?', 'Manageability', ['High availability', 'Elasticity', 'Data redundancy']),

    q('A cloud application recovers from component failures without losing its service objective. Which benefit does this demonstrate?', 'Reliability', ['Consumption pricing', 'Data tagging', 'Shared responsibility']),
    q('A team adds more virtual machines to handle increased demand. Which type of scaling is this?', 'Horizontal scaling', ['Vertical scaling', 'Data scaling', 'Geographic scaling']),
    q('A team increases the CPU and memory assigned to one virtual machine. Which type of scaling is this?', 'Vertical scaling', ['Horizontal scaling', 'Elastic scaling only', 'Zone scaling']),
    q('Security tools and centrally enforced configuration reduce inconsistent resource settings. Which cloud benefits do these capabilities primarily support?', 'Security and governance', ['Capital ownership and depreciation', 'Physical server maintenance', 'Perpetual licensing'])
  ],
  'service-types': [
    q('A team needs full control of the guest operating system for a legacy application. Which cloud service type is the best fit?', 'Infrastructure as a service (IaaS)', ['Platform as a service (PaaS)', 'Software as a service (SaaS)', 'Business process as a service']),
    q('Developers want to deploy web code without maintaining the operating system or web server. Which service type is the best fit?', 'Platform as a service (PaaS)', ['Infrastructure as a service (IaaS)', 'Software as a service (SaaS)', 'Private cloud only']),
    q('Users access a provider-managed email application through a browser. Which service type is this?', 'Software as a service (SaaS)', ['Infrastructure as a service (IaaS)', 'Platform as a service (PaaS)', 'Serverless infrastructure']),
    q('Which service type gives the customer the greatest control over operating systems and networking configuration?', 'Infrastructure as a service (IaaS)', ['Platform as a service (PaaS)', 'Software as a service (SaaS)', 'Managed productivity software']),
    q('A managed application platform automatically patches its runtime while developers manage their application and data. Which service type is it?', 'Platform as a service (PaaS)', ['Infrastructure as a service (IaaS)', 'Software as a service (SaaS)', 'Private infrastructure']),

    q('A company replaces an on-premises CRM system with a complete subscription application. Which cloud service type is being adopted?', 'Software as a service (SaaS)', ['Infrastructure as a service (IaaS)', 'Platform as a service (PaaS)', 'Colocation']),
    q('A database development team wants built-in backups and patching but must control schemas and data. Which service type is most appropriate?', 'Platform as a service (PaaS)', ['Infrastructure as a service (IaaS)', 'Software as a service (SaaS)', 'Physical hosting']),
    q('An administrator installs a custom network appliance on an Azure virtual machine. Which service type does the virtual machine represent?', 'Infrastructure as a service (IaaS)', ['Platform as a service (PaaS)', 'Software as a service (SaaS)', 'Function as a desktop']),
    q('In which service type does the provider manage the application, runtime, operating system, and infrastructure?', 'Software as a service (SaaS)', ['Infrastructure as a service (IaaS)', 'Platform as a service (PaaS)', 'Customer-managed private cloud']),
    q('A team wants to focus on application code while the provider manages middleware and operating systems. Which model should it choose?', 'Platform as a service (PaaS)', ['Infrastructure as a service (IaaS)', 'Software as a service (SaaS)', 'On-premises hosting']),

    q('A lift-and-shift migration moves an existing server to an Azure virtual machine with minimal application changes. Which service type is used?', 'Infrastructure as a service (IaaS)', ['Platform as a service (PaaS)', 'Software as a service (SaaS)', 'Serverless SaaS']),
    q('Employees collaborate in Microsoft 365 without managing application servers. Which cloud service type describes Microsoft 365?', 'Software as a service (SaaS)', ['Infrastructure as a service (IaaS)', 'Platform as a service (PaaS)', 'Hybrid infrastructure']),
    q('Which service type normally requires the customer to patch the guest operating system?', 'Infrastructure as a service (IaaS)', ['Platform as a service (PaaS)', 'Software as a service (SaaS)', 'Managed SaaS database']),
    q('Which service type is most appropriate for rapidly building an API with a managed runtime and integrated scaling?', 'Platform as a service (PaaS)', ['Infrastructure as a service (IaaS)', 'Software as a service (SaaS)', 'Physical colocation']),
    q('A company subscribes to a fully managed payroll application and configures only its users and business settings. Which service type is this?', 'Software as a service (SaaS)', ['Infrastructure as a service (IaaS)', 'Platform as a service (PaaS)', 'Hosted hypervisor'])
  ],
  'azure-architecture': [
    q('A solution must place resources in a geographic area that contains one or more Azure datacenters. What is this area called?', 'An Azure region', ['A resource group', 'A management group', 'An availability set']),
    q('Which Azure construct provides physically separate locations within a region, each with independent power, cooling, and networking?', 'Availability zones', ['Resource groups', 'Management groups', 'Subscriptions']),
    q('Several resources share the same lifecycle and should be managed together. Where should they be placed?', 'In one resource group', ['In one availability zone', 'In one Microsoft Entra tenant only', 'In one storage container']),
    m('Which TWO statements about Azure resource groups are correct?', ['A resource belongs to one resource group at a time', 'A resource group can contain resources from different Azure regions'], ['A resource group can belong to several subscriptions simultaneously', 'Deleting a resource group never affects its resources']),

    q('A company needs separate billing boundaries for its development and production organizations. Which Azure construct should it use?', 'Separate subscriptions', ['Separate availability zones only', 'Separate resource locks', 'Separate storage tiers']),
    q('Policies must be assigned across several Azure subscriptions. At which scope can the subscriptions be organized?', 'A management group', ['A resource group', 'An availability set', 'A virtual network']),
    q('Which hierarchy is ordered from broadest scope to narrowest scope?', 'Management group, subscription, resource group, resource', ['Subscription, management group, resource, resource group', 'Resource group, management group, subscription, resource', 'Resource, resource group, management group, subscription']),
    m('Which TWO statements describe availability zones?', ['They are separate physical locations within an Azure region', 'They provide independent power, cooling, and networking'], ['They are billing containers above management groups', 'They guarantee that all Azure regions contain exactly three zones']),

    q('A government workload must run in an isolated Azure instance designed for specific sovereignty requirements. Which type of region may be appropriate?', 'A sovereign region', ['A resource group region', 'A pricing region only', 'An availability set']),
    q('What is the smallest physical facility described in Azure’s global infrastructure hierarchy?', 'A datacenter', ['A region pair', 'A geography', 'A management group']),
    q('An administrator moves a virtual machine to another resource group in the same subscription. What happens to the virtual machine’s Azure region?', 'It remains in its existing region', ['It automatically moves to the resource group’s region', 'It moves to the nearest region pair', 'It becomes regionless']),
    m('Which TWO Azure scopes can contain multiple subscriptions beneath them?', ['A management group', 'A Microsoft Entra tenant through its management-group hierarchy'], ['A resource group', 'An availability zone'])
  ],
  'compute-networking': [
    q('A stateless web tier uses identical virtual machines and must automatically add instances as demand grows. Which service is designed for this?', 'Azure Virtual Machine Scale Sets', ['Azure DNS', 'Azure Files', 'Microsoft Purview']),
    q('Code should execute in response to events without the team managing servers. Which Azure compute service is the best fit?', 'Azure Functions', ['Azure Virtual Desktop', 'Azure VPN Gateway', 'Azure Files']),
    q('A web application needs managed hosting, deployment slots, and built-in scaling. Which service should host it?', 'Azure App Service', ['Azure Virtual Network', 'Azure DNS', 'Azure Data Box']),
    q('Two virtual networks need private connectivity over the Microsoft backbone. Which feature should be configured?', 'Virtual network peering', ['Azure DNS public zones', 'A public endpoint', 'Azure Cost Management']),
    q('An on-premises network needs encrypted connectivity to Azure over the public internet. Which service should be used?', 'Azure VPN Gateway', ['Azure ExpressRoute only', 'Azure Policy', 'Azure Advisor']),

    q('A company requires a private dedicated connection from its on-premises network to Azure that does not traverse the public internet. Which service should it use?', 'Azure ExpressRoute', ['Azure VPN Gateway over the internet', 'Virtual network peering', 'Azure DNS']),
    q('A workload packages its application and dependencies into a portable image but does not require a full guest operating system per instance. Which compute type fits?', 'Containers', ['Azure virtual machines only', 'Azure DNS zones', 'Resource groups']),
    q('Remote employees need cloud-hosted Windows desktops and applications. Which service should be used?', 'Azure Virtual Desktop', ['Azure App Service', 'Azure Functions', 'Azure Blob Storage']),
    q('Which Azure service resolves domain names to IP addresses?', 'Azure DNS', ['Azure Policy', 'Azure Monitor', 'Azure Arc']),
    q('A storage account must be reached through a private IP address in a virtual network. Which networking feature is required?', 'A private endpoint', ['A public endpoint', 'A management group', 'A resource tag']),

    q('An application requires complete control over its Windows operating system and installed software. Which compute option is most appropriate?', 'An Azure virtual machine', ['Azure Functions', 'Azure DNS', 'Azure Policy']),
    q('Several virtual machines must be distributed across fault and update domains in one datacenter. Which construct should be used?', 'An availability set', ['A management group', 'A resource group lock', 'A DNS zone']),
    q('Resources in one virtual network must be divided into separate IP address ranges. What should be created?', 'Subnets', ['Subscriptions', 'Management groups', 'Availability sets']),
    q('Which endpoint type allows an Azure service to be reached from the internet, subject to access controls?', 'A public endpoint', ['A private endpoint only', 'A resource lock', 'A storage tier']),
    q('A company wants a managed container platform with Kubernetes orchestration. Which Azure compute service should it evaluate?', 'Azure Kubernetes Service (AKS)', ['Azure Virtual Desktop', 'Azure Files', 'Azure Advisor'])
  ],
  'azure-storage': [
    q('An application needs to store images and video as unstructured objects. Which Azure Storage service should it use?', 'Azure Blob Storage', ['Azure Queue Storage', 'Azure Table Storage', 'Azure DNS']),
    q('Windows and Linux systems need a managed shared file system accessed with SMB. Which service should be used?', 'Azure Files', ['Azure Blob Storage only', 'Azure Queue Storage', 'Azure Table Storage']),
    q('Application components need asynchronous message delivery through a simple backlog. Which storage service is designed for this?', 'Azure Queue Storage', ['Azure Files', 'Azure Disk Storage', 'Azure DNS']),
    q('Data must remain available if a datacenter in one region becomes unavailable, but replication to another region is not required. Which redundancy option fits?', 'Zone-redundant storage (ZRS)', ['Locally redundant storage (LRS)', 'Geo-redundant storage (GRS)', 'Read-access geo-redundant storage (RA-GRS)']),
    q('Frequently accessed objects require the lowest access cost. Which blob access tier is most appropriate?', 'Hot tier', ['Cool tier', 'Cold tier', 'Archive tier']),

    q('A company needs to copy many files to and from Azure Storage from a command line. Which tool should it use?', 'AzCopy', ['Azure Policy', 'Azure Advisor', 'Microsoft Purview']),
    q('Users need a graphical tool to manage blobs, files, queues, and tables. Which tool should they use?', 'Azure Storage Explorer', ['Azure Service Health', 'Azure Pricing Calculator', 'Azure Arc']),
    q('An on-premises Windows file server should cache an Azure file share and synchronize changes. Which service supports this?', 'Azure File Sync', ['Azure Data Box', 'Azure Migrate', 'Azure DNS']),
    q('A company must transfer hundreds of terabytes to Azure where network bandwidth is insufficient. Which option is most appropriate?', 'Azure Data Box', ['Azure Monitor alerts', 'Azure Policy', 'Azure Functions']),
    q('Data must be replicated synchronously across zones and asynchronously to a secondary region. Which option provides this?', 'Geo-zone-redundant storage (GZRS)', ['Locally redundant storage (LRS)', 'Zone-redundant storage (ZRS)', 'Archive storage only']),

    q('Compliance records are rarely retrieved and can tolerate hours of retrieval latency. Which blob access tier is most cost-effective?', 'Archive tier', ['Hot tier', 'Premium tier', 'Transaction optimized tier']),
    q('Managed disks attached to Azure virtual machines use which broad storage category?', 'Disk storage', ['Queue storage', 'Table storage', 'DNS storage']),
    q('An application needs a schemaless key-value store for large amounts of nonrelational structured data. Which service should it use?', 'Azure Table Storage', ['Azure Files', 'Azure Disk Storage', 'Azure VPN Gateway']),
    q('Which redundancy option keeps three synchronous copies in one physical datacenter?', 'Locally redundant storage (LRS)', ['Zone-redundant storage (ZRS)', 'Geo-redundant storage (GRS)', 'Geo-zone-redundant storage (GZRS)']),
    q('A company wants to assess and migrate on-premises servers, databases, and applications to Azure. Which service should it use?', 'Azure Migrate', ['AzCopy', 'Azure Queue Storage', 'Azure DNS'])
  ],
  'identity-security': [
    q('Which service provides cloud-based identity and access management for Azure and Microsoft 365?', 'Microsoft Entra ID', ['Azure DNS', 'Azure Monitor', 'Azure Storage Explorer']),
    q('Users should sign in once and access several authorized applications without signing in again. Which feature is required?', 'Single sign-on (SSO)', ['Geo-redundancy', 'Network peering', 'Resource locking']),
    q('A sign-in must require a password and a verification code from a phone. Which capability is being used?', 'Multifactor authentication (MFA)', ['Single sign-on only', 'Azure Policy', 'Role inheritance']),
    q('Permissions to manage virtual machines should be granted according to a user’s job role. Which capability should be used?', 'Azure role-based access control (RBAC)', ['Azure DNS', 'Azure Service Health', 'A resource tag']),
    m('Which TWO principles are part of a Zero Trust approach?', ['Verify explicitly', 'Use least-privilege access'], ['Trust every request from the corporate network', 'Grant permanent owner access by default']),

    q('A company wants to invite a partner’s identity to access selected applications. Which Microsoft Entra capability supports this?', 'External identities', ['Availability sets', 'Storage tiers', 'Azure Data Box']),
    q('Access should be allowed only from compliant devices and require MFA for risky sign-ins. Which feature should be configured?', 'Microsoft Entra Conditional Access', ['Azure Storage lifecycle management', 'Azure DNS', 'Resource locks']),
    q('A company needs managed domain join, LDAP, and Kerberos for legacy applications without deploying domain controllers. Which service should it use?', 'Microsoft Entra Domain Services', ['Azure RBAC', 'Azure Service Health', 'Azure Queue Storage']),
    q('Which security model uses multiple protective layers so another layer remains if one control fails?', 'Defense in depth', ['Consumption-based pricing', 'Horizontal scaling', 'Resource grouping']),
    m('Which TWO capabilities are provided by Microsoft Defender for Cloud?', ['Security posture recommendations', 'Workload threat protection'], ['Domain-name registration', 'Blob access-tier selection']),

    q('A user signs in with a fingerprint instead of a password. Which authentication category does this represent?', 'Passwordless authentication', ['Single-factor password authentication', 'Resource authorization only', 'Storage encryption']),
    q('A team needs to grant read-only access to resources in one resource group. What should it assign?', 'An Azure RBAC role at the resource-group scope', ['A storage access tier', 'An Azure region pair', 'A DNS record']),
    q('In a defense-in-depth strategy, which layer focuses on user identities and access privileges?', 'The identity and access layer', ['The physical security layer only', 'The data transfer pricing layer', 'The availability-zone layer']),
    q('Which principle assumes a breach may already have occurred and designs controls accordingly?', 'Assume breach', ['Trust the internal network', 'Use maximum privilege', 'Disable monitoring']),
    m('Which TWO methods can strengthen authentication beyond a reusable password?', ['Multifactor authentication', 'Passwordless authentication'], ['A resource tag', 'A storage lifecycle rule'])
  ],
  'cost-management': [
    q('A solution architect wants to estimate the monthly price of planned Azure resources before deployment. Which tool should be used?', 'Azure Pricing Calculator', ['Azure Service Health', 'Azure Policy', 'Microsoft Purview']),
    q('A finance team needs to analyze actual Azure spending by subscription and service. Which capability should it use?', 'Microsoft Cost Management', ['Azure DNS', 'Azure Virtual Desktop', 'Azure Data Box']),
    q('Resources must be grouped in cost reports by department. What should be applied to the resources?', 'Tags', ['Availability zones', 'Private endpoints', 'Storage queues']),
    q('Which factor can change the cost of an otherwise identical Azure virtual machine?', 'The Azure region where it is deployed', ['Its resource-group name', 'The order of its tags', 'Its management-group display name']),

    q('A team wants notification when forecast spending approaches a monthly limit. What should it create?', 'A budget with alerts in Cost Management', ['A resource lock', 'An availability set', 'A private endpoint']),
    q('A stable virtual machine workload will run continuously for several years. Which purchasing option may reduce compute cost?', 'A reservation', ['A resource tag', 'A public endpoint', 'A read-only lock']),
    q('Which network activity commonly adds to an Azure bill?', 'Outbound data transfer from Azure', ['Inbound data transfer in all cases', 'Renaming a resource group', 'Viewing a resource in the portal']),
    q('Development virtual machines are unused overnight. Which action can reduce their compute charges?', 'Stop and deallocate them when not needed', ['Add more tags', 'Move them to another resource group', 'Enable a read-only lock']),

    q('Management needs cost totals by project, but resources are spread across resource groups. Which metadata helps allocate the costs?', 'Consistent project tags', ['Availability-zone numbers', 'Private IP addresses', 'DNS aliases']),
    q('Which tool can recommend underutilized resources that may be resized to reduce cost?', 'Azure Advisor', ['Azure DNS', 'Microsoft Entra ID', 'Azure Files']),
    q('A team compares pay-as-you-go prices for two architectures before either exists. Which tool should it use?', 'Azure Pricing Calculator', ['Cost analysis of actual charges', 'Azure Service Health', 'Application Insights']),
    q('Which statement about Azure tags is correct?', 'Tags can add business metadata used for organization and cost reporting', ['Tags automatically grant RBAC permissions', 'Tags prevent resources from being deleted', 'Tags move resources between regions'])
  ],
  'governance-compliance': [
    q('New resources must be restricted to approved Azure regions. Which service should enforce this requirement?', 'Azure Policy', ['Azure DNS', 'Azure Advisor', 'Azure Functions']),
    q('A production resource must not be accidentally deleted. Which feature should be applied?', 'A delete lock', ['A tag', 'An availability set', 'A budget']),
    q('A company needs unified data discovery, classification, and governance across its data estate. Which service should it use?', 'Microsoft Purview', ['Azure DNS', 'Azure Virtual Desktop', 'Azure Queue Storage']),
    q('An audit needs a list of resources that do not meet an assigned standard. Which Azure Policy capability provides this?', 'Compliance evaluation', ['DNS resolution', 'Cost reservation', 'Virtual network peering']),

    q('A policy should automatically audit whether storage accounts require secure transfer. Which service should be assigned?', 'Azure Policy', ['Azure Service Health', 'Azure Data Box', 'Azure Functions']),
    q('Administrators should be able to read a critical resource but not modify it. Which feature should be applied?', 'A read-only lock', ['A delete lock', 'A cost tag', 'A private endpoint']),
    q('Which service helps an organization understand where sensitive data exists and how it is used?', 'Microsoft Purview', ['Azure Advisor', 'Azure VPN Gateway', 'Azure Virtual Desktop']),
    q('Where can an Azure Policy assignment be scoped?', 'At a management group, subscription, or resource group', ['Only at an availability zone', 'Only at a datacenter', 'Only at a DNS zone']),

    q('A resource has both a delete lock and an Azure RBAC Owner assignment for a user. What prevents that user from deleting the resource?', 'The delete lock', ['The Owner role', 'The resource tag', 'The pricing tier']),
    q('A company wants every new resource to include a required cost-center tag. Which service can enforce or remediate this rule?', 'Azure Policy', ['Azure Service Health', 'Azure DNS', 'Azure ExpressRoute']),
    q('Which statement correctly distinguishes Azure Policy from Azure RBAC?', 'Policy evaluates resource compliance, while RBAC controls permitted user actions', ['Policy resolves DNS, while RBAC selects storage tiers', 'Policy calculates cost, while RBAC creates budgets', 'Policy and RBAC perform exactly the same function']),
    q('Which governance feature inherits through the Azure scope hierarchy when assigned at a management group?', 'Azure Policy assignments', ['Availability zones', 'Storage access tiers', 'Virtual machine sizes'])
  ],
  'management-deployment': [
    q('An administrator wants a browser-based graphical interface to create and manage Azure resources. Which tool should be used?', 'The Azure portal', ['AzCopy', 'Azure Data Box', 'Application Insights']),
    q('An administrator needs an authenticated shell in the browser with Azure CLI and Azure PowerShell available. Which service should be opened?', 'Azure Cloud Shell', ['Azure Service Health', 'Microsoft Purview', 'Azure Files']),
    q('A team wants declarative, repeatable Azure deployments stored in source control. Which approach should it use?', 'Infrastructure as code (IaC)', ['Manual portal-only deployment', 'Resource tagging only', 'A pricing estimate']),
    q('Which Azure control plane receives requests from the portal, CLI, PowerShell, and APIs?', 'Azure Resource Manager', ['Azure DNS', 'Azure Monitor only', 'Azure Virtual Desktop']),
    m('Which TWO benefits are associated with ARM templates?', ['Repeatable declarative deployments', 'Consistent deployment of multiple related resources'], ['Automatic replacement of every application with SaaS', 'Permanent prevention of all configuration changes']),

    q('A company wants to manage servers running on-premises and in other clouds through Azure. Which service should it use?', 'Azure Arc', ['Azure Data Box', 'Azure Files', 'Azure DNS']),
    q('A Linux-focused administrator wants to automate Azure with cross-platform command syntax. Which tool is appropriate?', 'Azure CLI', ['Azure Resource locks', 'Azure Advisor', 'Microsoft Purview']),
    q('An administrator prefers PowerShell cmdlets and object-based pipelines. Which Azure management tool should be used?', 'Azure PowerShell', ['Azure DNS', 'AzCopy only', 'Azure Service Health']),
    q('What format do traditional ARM templates use?', 'JSON', ['A compiled executable', 'A relational database', 'A DNS zone file only']),
    m('Which TWO tools can issue commands to Azure Resource Manager from Azure Cloud Shell?', ['Azure CLI', 'Azure PowerShell'], ['Azure Data Box', 'Microsoft Purview data map']),

    q('A template deployment is run twice with no template changes. What is the intended result of declarative infrastructure as code?', 'The environment remains in the declared state', ['Every resource is duplicated', 'All existing resources are deleted', 'The subscription is moved to another tenant']),
    q('Which Azure feature provides a simplified declarative language that compiles to ARM templates?', 'Bicep', ['Azure DNS', 'Azure Queue Storage', 'Microsoft Entra Domain Services']),
    q('A developer needs to manage Azure resources from a local terminal using commands such as az group create. Which tool is being used?', 'Azure CLI', ['Azure PowerShell', 'Azure Advisor', 'Azure Policy']),
    q('Why are ARM template deployments considered repeatable?', 'The desired resource configuration is defined declaratively in a file', ['The portal records every mouse movement', 'Tags perform each deployment', 'Availability zones copy the source code']),
    m('Which TWO interfaces use Azure Resource Manager as the common deployment and management layer?', ['The Azure portal', 'Azure CLI'], ['Azure Data Box hardware', 'A storage access tier'])
  ],
  monitoring: [
    q('An administrator wants personalized recommendations to improve cost, security, reliability, and performance. Which service should be used?', 'Azure Advisor', ['Azure DNS', 'Azure Data Box', 'Microsoft Entra ID']),
    q('A team needs information about an Azure outage that affects its resources. Which service should it check?', 'Azure Service Health', ['Azure Pricing Calculator', 'Azure Policy', 'Azure Storage Explorer']),
    q('Metrics and logs from Azure resources need to be collected and analyzed centrally. Which service provides this platform?', 'Azure Monitor', ['Azure DNS', 'Azure Arc', 'Azure Data Box']),
    q('Application developers need request rates, dependencies, exceptions, and performance telemetry. Which feature should they use?', 'Application Insights', ['Azure Policy', 'Azure Files', 'Microsoft Purview']),

    q('Operations staff want an email when CPU usage exceeds a threshold. Which capability should they configure?', 'An Azure Monitor alert', ['A resource lock', 'A storage tier', 'A management group']),
    q('A team needs to query collected log data using Kusto Query Language. Which Azure Monitor capability should it use?', 'Log Analytics', ['Azure Advisor', 'Azure DNS', 'Azure Pricing Calculator']),
    q('Which service shows planned maintenance and health advisories that are relevant to an organization’s subscriptions?', 'Azure Service Health', ['The public Azure status page only', 'Azure Files', 'Microsoft Purview']),
    q('Which tool reports recommendations but does not automatically implement every suggested change?', 'Azure Advisor', ['Azure Resource Manager', 'Azure DNS', 'Azure Data Box']),

    q('A team needs a visual dashboard combining resource metrics and log-query results. Which platform should it use?', 'Azure Monitor', ['Azure Policy', 'Azure Files', 'Azure Cost tags']),
    q('Which monitoring capability traces application requests across dependencies?', 'Application Insights', ['Azure Service Health', 'Azure Pricing Calculator', 'Azure Data Box']),
    q('A global Azure incident should be checked before sign-in-specific impact is known. Which public resource gives broad service status?', 'Azure status', ['Azure Policy compliance', 'Azure Advisor recommendations', 'Azure Storage Explorer']),
    q('Which Azure Monitor data type records time-stamped numeric values such as CPU percentage?', 'Metrics', ['Resource locks', 'Tags', 'Management groups'])
  ]
};

const blueprint = [
  ['cloud-computing', 5],
  ['cloud-benefits', 4],
  ['service-types', 5],
  ['azure-architecture', 4],
  ['compute-networking', 5],
  ['azure-storage', 5],
  ['identity-security', 5],
  ['cost-management', 4],
  ['governance-compliance', 4],
  ['management-deployment', 5],
  ['monitoring', 4]
];

const paperNames = ['Cloud Foundations and Core Services', 'Applied Azure Scenarios', 'Architecture, Security, and Governance'];

for (let paperIndex = 0; paperIndex < 3; paperIndex += 1) {
  const items = blueprint.flatMap(([objectiveId, perPaper]) => {
    const objective = objectives[objectiveId];
    return banks[objectiveId].slice(paperIndex * perPaper, (paperIndex + 1) * perPaper).map((item) => ({
      ...item,
      domainId: objective.domainId,
      objectiveId
    }));
  });
  assignDifficulty(items);

  const enriched = items.map((item, questionIndex) => {
    const objective = objectives[item.objectiveId];
    const answers = item.type === 'multi-select' ? item.answers : [item.answer];
    const answerText = answers.map((answer) => `“${answer}”`).join(' and ');
    return {
      ...item,
      id: `az900-p${paperIndex + 1}-q${String(questionIndex + 1).padStart(2, '0')}`,
      explanation: `${answerText} ${answers.length > 1 ? 'are the required choices' : 'is the best answer'} because it directly matches the requirement in the scenario. ${objective.note}`,
      references: [{ title: objective.reference[0], url: objective.reference[1] }]
    };
  });

  const dataset = {
    title: `AZ-900 Mock Exam ${paperIndex + 1}: ${paperNames[paperIndex]}`,
    description: 'A 50-question unofficial mock paper aligned to the AZ-900 skills measured from July 20, 2026. Covers cloud concepts, Azure architecture and services, and management and governance. Includes detailed explanations and official Microsoft Learn references. Original practice content; not official exam questions.',
    tags: ['az-900', 'azure', 'fundamentals', 'mock-exam'],
    shuffleQuestions: true,
    kind: 'exam',
    curated: true,
    examCode: 'AZ-900',
    blueprintVersion: '2026-07-20',
    durationMinutes: 45,
    readinessTarget: 70,
    domains: [
      { id: 'cloud-concepts', title: 'Describe cloud concepts', weight: 28 },
      { id: 'architecture-services', title: 'Describe Azure architecture and services', weight: 38 },
      { id: 'management-governance', title: 'Describe Azure management and governance', weight: 34 }
    ],
    items: enriched
  };

  writeFileSync(`datasets/az-900-mock-exam-${paperIndex + 1}.json`, `${JSON.stringify(dataset, null, 2)}\n`);
}

function q(prompt, answer, distractors) {
  return { type: 'multiple-choice', prompt, answer, options: [answer, ...distractors] };
}

function m(prompt, answers, distractors) {
  return { type: 'multi-select', prompt, answers, options: [...answers, ...distractors] };
}

function assignDifficulty(items) {
  const ranked = items.map((item, index) => ({
    index,
    score: item.prompt.length + Math.max(...item.options.map((option) => option.length)) + (item.type === 'multi-select' ? 60 : 0)
  })).sort((left, right) => left.score - right.score || left.index - right.index);
  items.forEach((item) => { item.difficulty = 'medium'; });
  ranked.slice(0, 10).forEach(({ index }) => { items[index].difficulty = 'easy'; });
  ranked.slice(-10).forEach(({ index }) => { items[index].difficulty = 'hard'; });
}
