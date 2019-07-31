# Change Log

## [v1.0.1](https://github.com/rekcurd/dashboard/tree/v1.0.1)

[Full Changelog](https://github.com/rekcurd/dashboard/compare/v1.0.0...v1.0.1)

**Closed issues:**

- Use Secret for private git repository [\#76](https://github.com/rekcurd/dashboard/issues/76)
- Add storage options for ML models and evaluation data [\#69](https://github.com/rekcurd/dashboard/issues/69)

**Merged pull requests:**

- Specify version [\#113](https://github.com/rekcurd/dashboard/pull/113) ([keigohtr](https://github.com/keigohtr))
- Specify `long\_description\_content\_type` [\#112](https://github.com/rekcurd/dashboard/pull/112) ([keigohtr](https://github.com/keigohtr))
- Use `tempfile` to avoid the conflict. [\#111](https://github.com/rekcurd/dashboard/pull/111) ([keigohtr](https://github.com/keigohtr))
- remove duplicated\_ok [\#109](https://github.com/rekcurd/dashboard/pull/109) ([yuki-mt](https://github.com/yuki-mt))
- fix order of changing state [\#108](https://github.com/rekcurd/dashboard/pull/108) ([yuki-mt](https://github.com/yuki-mt))
- LocalHanlder does nothing [\#106](https://github.com/rekcurd/dashboard/pull/106) ([yuki-mt](https://github.com/yuki-mt))
- evaluation result list page [\#105](https://github.com/rekcurd/dashboard/pull/105) ([yuki-mt](https://github.com/yuki-mt))
- add evaluation data page [\#103](https://github.com/rekcurd/dashboard/pull/103) ([yuki-mt](https://github.com/yuki-mt))
- raise exception when adding git secret without k8s [\#102](https://github.com/rekcurd/dashboard/pull/102) ([yuki-mt](https://github.com/yuki-mt))
- Add breadcrumb [\#100](https://github.com/rekcurd/dashboard/pull/100) ([keigohtr](https://github.com/keigohtr))
- Add GCS support [\#95](https://github.com/rekcurd/dashboard/pull/95) ([keigohtr](https://github.com/keigohtr))
- Add secret for private git [\#94](https://github.com/rekcurd/dashboard/pull/94) ([keigohtr](https://github.com/keigohtr))
- Add `settings.yml` template generation script [\#93](https://github.com/rekcurd/dashboard/pull/93) ([keigohtr](https://github.com/keigohtr))
- Delete migrations dir [\#92](https://github.com/rekcurd/dashboard/pull/92) ([keigohtr](https://github.com/keigohtr))
- Disable `Sync` button [\#91](https://github.com/rekcurd/dashboard/pull/91) ([keigohtr](https://github.com/keigohtr))
- Sync kubernetes when registered [\#90](https://github.com/rekcurd/dashboard/pull/90) ([keigohtr](https://github.com/keigohtr))

## [v1.0.0](https://github.com/rekcurd/dashboard/tree/v1.0.0) (2019-04-26)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.4.5...v1.0.0)

**Fixed bugs:**

- Cannot work `kube.datadir` if we change the value after registering kubernetes service [\#67](https://github.com/rekcurd/dashboard/issues/67)
- Uploading model sometimes returns errors. [\#64](https://github.com/rekcurd/dashboard/issues/64)

**Closed issues:**

- Add `kubernetes mode flag` to Project settings [\#86](https://github.com/rekcurd/dashboard/issues/86)
- Add image driven boot option [\#77](https://github.com/rekcurd/dashboard/issues/77)
- Add access control to Kubernetes [\#65](https://github.com/rekcurd/dashboard/issues/65)
- Replace library redux-form to formik [\#61](https://github.com/rekcurd/dashboard/issues/61)
- Application permission can be reset if we delete Kubernetes and register it again [\#57](https://github.com/rekcurd/dashboard/issues/57)
- Deployable to the application which we don't have a permission [\#53](https://github.com/rekcurd/dashboard/issues/53)
- Fixed ssh directory mount path [\#48](https://github.com/rekcurd/dashboard/issues/48)
- Support different Kubernetes cluster but same application [\#46](https://github.com/rekcurd/dashboard/issues/46)

**Merged pull requests:**

- remove redux-thunk [\#89](https://github.com/rekcurd/dashboard/pull/89) ([yuki-mt](https://github.com/yuki-mt))
- fix console command [\#88](https://github.com/rekcurd/dashboard/pull/88) ([yuki-mt](https://github.com/yuki-mt))
- Add kubernetes mode flag to project [\#85](https://github.com/rekcurd/dashboard/pull/85) ([keigohtr](https://github.com/keigohtr))
- Update documents [\#84](https://github.com/rekcurd/dashboard/pull/84) ([keigohtr](https://github.com/keigohtr))
- Renewal dashboard frontend [\#83](https://github.com/rekcurd/dashboard/pull/83) ([keigohtr](https://github.com/keigohtr))
- delete evaluate files [\#82](https://github.com/rekcurd/dashboard/pull/82) ([yuki-mt](https://github.com/yuki-mt))
- quit saving evaluate result as file [\#81](https://github.com/rekcurd/dashboard/pull/81) ([yuki-mt](https://github.com/yuki-mt))
- \[Bugfix\]add logger option to db handler for KeyError [\#80](https://github.com/rekcurd/dashboard/pull/80) ([yuki-mt](https://github.com/yuki-mt))
- Renewal dashboard backend [\#75](https://github.com/rekcurd/dashboard/pull/75) ([keigohtr](https://github.com/keigohtr))
- Optimize architecture [\#74](https://github.com/rekcurd/dashboard/pull/74) ([keigohtr](https://github.com/keigohtr))
- Bugfix: allow multiple evaluated services [\#73](https://github.com/rekcurd/dashboard/pull/73) ([yuki-mt](https://github.com/yuki-mt))
- add label to EvaluateResult result [\#72](https://github.com/rekcurd/dashboard/pull/72) ([yuki-mt](https://github.com/yuki-mt))
- add temporary path for evaluation data [\#71](https://github.com/rekcurd/dashboard/pull/71) ([yuki-mt](https://github.com/yuki-mt))
- Rename from `drucker` to `rekcurd` [\#70](https://github.com/rekcurd/dashboard/pull/70) ([keigohtr](https://github.com/keigohtr))

## [v0.4.5](https://github.com/rekcurd/dashboard/tree/v0.4.5) (2019-01-30)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.4.4...v0.4.5)

**Fixed bugs:**

- \[Bug fix\] Fix kube config filepath [\#68](https://github.com/rekcurd/dashboard/pull/68) ([keigohtr](https://github.com/keigohtr))

**Merged pull requests:**

- \[Hotfix\] Request only when model switched [\#62](https://github.com/rekcurd/dashboard/pull/62) ([keigohtr](https://github.com/keigohtr))
- Unittest py37 support [\#60](https://github.com/rekcurd/dashboard/pull/60) ([keigohtr](https://github.com/keigohtr))
- Set default role to `Role.viewer` [\#58](https://github.com/rekcurd/dashboard/pull/58) ([keigohtr](https://github.com/keigohtr))
- Add cascade deletion for application\_user\_roles [\#56](https://github.com/rekcurd/dashboard/pull/56) ([keigohtr](https://github.com/keigohtr))
- implement API for EvaluationResult protocol [\#55](https://github.com/rekcurd/dashboard/pull/55) ([yuki-mt](https://github.com/yuki-mt))

## [v0.4.4](https://github.com/rekcurd/dashboard/tree/v0.4.4) (2019-01-15)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.8...v0.4.4)

**Closed issues:**

- Add access control [\#20](https://github.com/rekcurd/dashboard/issues/20)

**Merged pull requests:**

- Pipnize [\#54](https://github.com/rekcurd/dashboard/pull/54) ([keigohtr](https://github.com/keigohtr))

## [v0.3.8](https://github.com/rekcurd/dashboard/tree/v0.3.8) (2018-12-26)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.7...v0.3.8)

**Merged pull requests:**

- Update readme [\#52](https://github.com/rekcurd/dashboard/pull/52) ([keigohtr](https://github.com/keigohtr))
- change to run rekcurd on EKS [\#51](https://github.com/rekcurd/dashboard/pull/51) ([yuki-mt](https://github.com/yuki-mt))
- separate evaluate and upload test data [\#50](https://github.com/rekcurd/dashboard/pull/50) ([yuki-mt](https://github.com/yuki-mt))
- Access control [\#49](https://github.com/rekcurd/dashboard/pull/49) ([sugyan](https://github.com/sugyan))

## [v0.3.7](https://github.com/rekcurd/dashboard/tree/v0.3.7) (2018-11-28)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.6...v0.3.7)

## [v0.3.6](https://github.com/rekcurd/dashboard/tree/v0.3.6) (2018-11-20)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.5...v0.3.6)

**Closed issues:**

- Handle parallel request return status [\#30](https://github.com/rekcurd/dashboard/issues/30)

**Merged pull requests:**

- evaluate model API [\#45](https://github.com/rekcurd/dashboard/pull/45) ([yuki-mt](https://github.com/yuki-mt))
- \[Hotfix\] Set "DRUCKER\_TEST\_MODE=False" when it deploys to Kubernetes [\#43](https://github.com/rekcurd/dashboard/pull/43) ([keigohtr](https://github.com/keigohtr))
- Make dump method independent from update method [\#42](https://github.com/rekcurd/dashboard/pull/42) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Update README [\#40](https://github.com/rekcurd/dashboard/pull/40) ([keigohtr](https://github.com/keigohtr))

## [v0.3.5](https://github.com/rekcurd/dashboard/tree/v0.3.5) (2018-11-07)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.4...v0.3.5)

**Merged pull requests:**

- \[Hotfix\] Fix `switchModel` API response handler [\#41](https://github.com/rekcurd/dashboard/pull/41) ([keigohtr](https://github.com/keigohtr))
- Create CODE\_OF\_CONDUCT.md [\#39](https://github.com/rekcurd/dashboard/pull/39) ([syleeeee](https://github.com/syleeeee))
- \[Hotfix\] Fix inaccurate boolean check [\#38](https://github.com/rekcurd/dashboard/pull/38) ([keigohtr](https://github.com/keigohtr))

## [v0.3.4](https://github.com/rekcurd/dashboard/tree/v0.3.4) (2018-10-03)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.3...v0.3.4)

**Merged pull requests:**

- \[Hotfix\] Limit application name length [\#36](https://github.com/rekcurd/dashboard/pull/36) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Fix file upload limit for gRPC and flask [\#35](https://github.com/rekcurd/dashboard/pull/35) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Add encode info [\#34](https://github.com/rekcurd/dashboard/pull/34) ([keigohtr](https://github.com/keigohtr))

## [v0.3.3](https://github.com/rekcurd/dashboard/tree/v0.3.3) (2018-08-29)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.2...v0.3.3)

**Merged pull requests:**

- \[Hotfix\] Specify non-auth endpoint [\#29](https://github.com/rekcurd/dashboard/pull/29) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Modify key name [\#28](https://github.com/rekcurd/dashboard/pull/28) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Fix error handling for frontend [\#27](https://github.com/rekcurd/dashboard/pull/27) ([sugyan](https://github.com/sugyan))
- \[Hotfix\] Allow `/api/settings` in auth module [\#26](https://github.com/rekcurd/dashboard/pull/26) ([sugyan](https://github.com/sugyan))
- Add sandbox env [\#24](https://github.com/rekcurd/dashboard/pull/24) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Avoid throwing when credential request comes [\#18](https://github.com/rekcurd/dashboard/pull/18) ([keigohtr](https://github.com/keigohtr))
- Refactor flask app [\#17](https://github.com/rekcurd/dashboard/pull/17) ([keigohtr](https://github.com/keigohtr))
- Add DB migration [\#14](https://github.com/rekcurd/dashboard/pull/14) ([keigohtr](https://github.com/keigohtr))
- Dump running Drucker service configurations for backup [\#7](https://github.com/rekcurd/dashboard/pull/7) ([keigohtr](https://github.com/keigohtr))

## [v0.3.2](https://github.com/rekcurd/dashboard/tree/v0.3.2) (2018-08-22)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.1...v0.3.2)

**Merged pull requests:**

- Fix MultipleResultsFound error [\#15](https://github.com/rekcurd/dashboard/pull/15) ([keigohtr](https://github.com/keigohtr))
- \[Hotfix\] Add `JWT\_TOKEN\_KEY` when fetch `rawMultiRequest` [\#13](https://github.com/rekcurd/dashboard/pull/13) ([keigohtr](https://github.com/keigohtr))
- fix invalid datetime [\#12](https://github.com/rekcurd/dashboard/pull/12) ([yuki-mt](https://github.com/yuki-mt))
- Add Service/Model list view [\#11](https://github.com/rekcurd/dashboard/pull/11) ([keigohtr](https://github.com/keigohtr))
- Add version info [\#5](https://github.com/rekcurd/dashboard/pull/5) ([keigohtr](https://github.com/keigohtr))

## [v0.3.1](https://github.com/rekcurd/dashboard/tree/v0.3.1) (2018-08-15)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.3.0...v0.3.1)

**Merged pull requests:**

- Add a function that allows you to select a model when booting a new service [\#10](https://github.com/rekcurd/dashboard/pull/10) ([keigohtr](https://github.com/keigohtr))
- Add convert function and fix wrong cpu values [\#9](https://github.com/rekcurd/dashboard/pull/9) ([jkw552403](https://github.com/jkw552403))
- \[Hotfix\] Change code generator [\#8](https://github.com/rekcurd/dashboard/pull/8) ([keigohtr](https://github.com/keigohtr))
- Add `progress\_deadline\_seconds` option [\#6](https://github.com/rekcurd/dashboard/pull/6) ([keigohtr](https://github.com/keigohtr))

## [v0.3.0](https://github.com/rekcurd/dashboard/tree/v0.3.0) (2018-08-08)
[Full Changelog](https://github.com/rekcurd/dashboard/compare/v0.2.0...v0.3.0)

**Merged pull requests:**

- Add `commit\_message` to be a rolling-update trigger [\#4](https://github.com/rekcurd/dashboard/pull/4) ([keigohtr](https://github.com/keigohtr))
- Add favicon [\#3](https://github.com/rekcurd/dashboard/pull/3) ([keigohtr](https://github.com/keigohtr))
- Change text [\#2](https://github.com/rekcurd/dashboard/pull/2) ([keigohtr](https://github.com/keigohtr))
- Add LDAP authentication [\#1](https://github.com/rekcurd/dashboard/pull/1) ([sugyan](https://github.com/sugyan))

## [v0.2.0](https://github.com/rekcurd/dashboard/tree/v0.2.0) (2018-07-25)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*